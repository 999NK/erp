import { IUsersRepository } from '../repositories/users.repository';
import { CreateUserDTO } from '../dtos/create-user.dto';
import { UserEntity } from '../entities/user.entity';
import { IHashProvider } from '../../../shared/providers/HashProvider';
import { prisma } from '../../../shared/infra/database/prisma';
import jwt from 'jsonwebtoken';

// ─────────────────────────────────────────────────────
// Permission Keys Registry (single source of truth)
// ─────────────────────────────────────────────────────
export const PERMISSION_CATALOG = {
  'dashboard': ['dashboard.view'],
  'products':  ['products.view', 'products.create', 'products.edit', 'products.delete'],
  'stock':     ['stock.view', 'stock.adjust'],
  'sales':     ['sales.view', 'sales.create', 'sales.cancel'],
  'pos':       ['pos.access'],
  'financial': ['financial.view', 'financial.create', 'financial.edit', 'financial.delete'],
  'customers': ['customers.view', 'customers.create', 'customers.edit', 'customers.delete'],
  'suppliers': ['suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete'],
  'reports':   ['reports.view', 'reports.export'],
  'users':     ['users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage'],
  'demands':   ['demands.view', 'demands.create', 'demands.edit', 'demands.delete'],
  'settings':  ['settings.view', 'settings.edit'],
} as const;

const ROLE_HIERARCHY: Record<string, number> = {
  'ADMIN': 3,
  'MANAGER': 2,
  'EMPLOYEE': 1,
};

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  'ADMIN':    ['*'], // Full access
  'MANAGER':  [
    'dashboard.view',
    'products.view', 'products.create', 'products.edit',
    'stock.view', 'stock.adjust',
    'sales.view', 'sales.create', 'sales.cancel',
    'pos.access',
    'financial.view',
    'customers.view', 'customers.create', 'customers.edit',
    'suppliers.view', 'suppliers.create', 'suppliers.edit',
    'reports.view', 'reports.export',
    'users.view', 'users.create', 'users.edit', 'users.manage',
    'demands.view', 'demands.create', 'demands.edit',
  ],
  'EMPLOYEE': [
    'dashboard.view',
    'pos.access',
    'sales.view', 'sales.create',
    'stock.view',
    'demands.view',
    'products.view',
    'customers.view',
  ],
};

export class UsersService {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly hashProvider: IHashProvider
  ) {}

  // ─────────────────────────────────────────────────────
  // CREATE USER
  // ─────────────────────────────────────────────────────
  async createUser(data: CreateUserDTO): Promise<UserEntity> {
    const existingUser = await this.usersRepository.findByEmail(data.email, data.companyId);
    if (existingUser) {
      throw new Error('E-mail já registrado para esta empresa.');
    }

    const passwordHash = await this.hashProvider.generateHash(data.passwordString);

    // Hierarchy enforcement
    if (data.creatorRole === 'MANAGER' && data.roleName === 'ADMIN') {
      throw new Error('Gerente não pode criar Administradores.');
    }
    if (data.creatorRole === 'EMPLOYEE') {
      throw new Error('Funcionário não tem permissão para criar usuários.');
    }

    const userCount = await prisma.user.count({ where: { companyId: data.companyId } });
    let roleName = data.roleName || 'EMPLOYEE';
    if (userCount === 0) {
      roleName = 'ADMIN'; // First user is always ADMIN
    }

    // Ensure the Role entity exists for this company
    let role = await prisma.role.findFirst({
      where: { companyId: data.companyId, name: roleName }
    });

    if (!role) {
      const perms = DEFAULT_PERMISSIONS[roleName] || DEFAULT_PERMISSIONS['EMPLOYEE'];
      role = await prisma.role.create({
        data: {
          companyId: data.companyId,
          name: roleName,
          description: `Perfil padrão: ${roleName}`,
          permissions: { create: perms.map(k => ({ permissionKey: k })) }
        }
      });
    }

    const user = new UserEntity({
      companyId: data.companyId,
      name: data.name,
      email: data.email,
      passwordHash,
      roleId: role.id,
      roleName,
      branchId: data.branchId || null,
      requirePasswordChange: data.requirePasswordChange ?? true,
      mfaEnabled: data.mfaEnabled ?? false,
      expiresAt: data.expiresAt || null,
      department: data.department || null,
      position: data.position || null,
      phone: data.phone || null,
      avatarUrl: data.avatarUrl || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createdUser = await this.usersRepository.create(user);

    await prisma.auditLog.create({
      data: {
        companyId: data.companyId,
        userId: createdUser.id,
        action: 'CREATE_USER',
        entity: 'User',
        entityId: createdUser.id,
        details: JSON.stringify({ email: data.email, role: roleName, position: data.position })
      }
    });

    return createdUser;
  }

  // ─────────────────────────────────────────────────────
  // LIST USERS
  // ─────────────────────────────────────────────────────
  async getUsers(companyId: string): Promise<UserEntity[]> {
    return this.usersRepository.findAll(companyId);
  }

  // ─────────────────────────────────────────────────────
  // GET PERMISSIONS (role-based + user overrides)
  // ─────────────────────────────────────────────────────
  async getPermissions(userId: string, companyId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId },
      include: { role: { include: { permissions: true } } }
    });
    if (!user) throw new Error('Usuário não encontrado');

    const rolePermissions = user.role?.permissions?.map(p => p.permissionKey) || [];
    const userOverrides = user.permissions ? JSON.parse(user.permissions) : null;

    return {
      roleName: user.roleName,
      rolePermissions,
      userOverrides,
      effectivePermissions: userOverrides || rolePermissions,
      catalog: PERMISSION_CATALOG,
    };
  }

  // ─────────────────────────────────────────────────────
  // UPDATE PERMISSIONS (via RolePermission table)
  // ─────────────────────────────────────────────────────
  async updatePermissions(userId: string, companyId: string, permissions: string[], executerRole: string) {
    const executerLevel = ROLE_HIERARCHY[executerRole] || 0;
    
    const targetUser = await prisma.user.findFirst({
      where: { id: userId, companyId },
      include: { role: true }
    });
    if (!targetUser) throw new Error('Usuário não encontrado');

    const targetLevel = ROLE_HIERARCHY[targetUser.roleName] || 0;

    // Cannot edit someone at same or higher hierarchy
    if (targetLevel >= executerLevel) {
      throw new Error('Você não pode alterar permissões de um usuário com nível igual ou superior.');
    }

    // Save as user-level overrides (JSON)
    await prisma.user.update({
      where: { id: userId },
      data: { permissions: JSON.stringify(permissions) }
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        action: 'UPDATE_PERMISSIONS',
        entity: 'User',
        entityId: userId,
        details: JSON.stringify({ permissions, updatedBy: executerRole })
      }
    });

    return this.getPermissions(userId, companyId);
  }

  // ─────────────────────────────────────────────────────
  // BLOCK / UNBLOCK
  // ─────────────────────────────────────────────────────
  async updateStatus(userId: string, companyId: string, isActive: boolean) {
    const user = await prisma.user.findFirst({ where: { id: userId, companyId } });
    if (!user) throw new Error('Usuário não encontrado');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      include: { role: true }
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        action: isActive ? 'UNBLOCK_USER' : 'BLOCK_USER',
        entity: 'User',
        entityId: userId,
        details: JSON.stringify({ name: user.name, email: user.email })
      }
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────
  // IMPERSONATE (Admin only)
  // ─────────────────────────────────────────────────────
  async impersonate(targetUserId: string, executerUser: any) {
    const executerLevel = ROLE_HIERARCHY[executerUser.role] || 0;

    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, companyId: executerUser.companyId },
      include: { role: { include: { permissions: true } } }
    });
    if (!targetUser) throw new Error('Usuário alvo não encontrado');

    const targetLevel = ROLE_HIERARCHY[targetUser.roleName] || 0;

    if (targetLevel >= executerLevel) {
      throw new Error('Só é possível personificar usuários de nível inferior.');
    }

    const token = jwt.sign(
      { sub: targetUser.id, companyId: targetUser.companyId, role: targetUser.roleName },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '1h' }
    );

    const permissions = targetUser.role?.permissions?.map(p => p.permissionKey) || [];

    return {
      token,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        roleName: targetUser.roleName,
        position: targetUser.position,
        companyId: targetUser.companyId,
        permissions,
      }
    };
  }

  // ─────────────────────────────────────────────────────
  // RESET PASSWORD
  // ─────────────────────────────────────────────────────
  async resetPassword(userId: string, companyId: string, newPassword: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, companyId } });
    if (!user) throw new Error('Usuário não encontrado');

    const passwordHash = await this.hashProvider.generateHash(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, requirePasswordChange: true }
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        action: 'RESET_PASSWORD',
        entity: 'User',
        entityId: userId,
        details: JSON.stringify({ name: user.name, email: user.email })
      }
    });

    return { success: true };
  }
}
