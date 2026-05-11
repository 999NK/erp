import { IUsersRepository } from '../users.repository';
import { UserEntity } from '../../entities/user.entity';
import { prisma } from '../../../../shared/infra/database/prisma';

export class PrismaUsersRepository implements IUsersRepository {
  async create(data: UserEntity): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: {
        id: data.id,
        companyId: data.companyId,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        roleId: data.roleId,
        roleName: data.roleName || 'EMPLOYEE',
        branchId: data.branchId,
        requirePasswordChange: data.requirePasswordChange,
        mfaEnabled: data.mfaEnabled,
        expiresAt: data.expiresAt,
        department: data.department,
        position: data.position,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        isActive: data.isActive,
      },
    });
    // Ensure casting to the correct DTO or passing only what is available in schema
    return new UserEntity(user);
  }

  async findByEmail(email: string, companyId: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { email_companyId: { email, companyId } },
      include: {
        role: {
          include: { permissions: true }
        }
      }
    });
    if (!user) return null;
    return new UserEntity(user);
  }

  async findById(id: string, companyId: string): Promise<UserEntity | null> {
    const user = await prisma.user.findFirst({
      where: { id, companyId },
      include: {
        role: {
          include: { permissions: true }
        }
      }
    });
    if (!user) return null;
    return new UserEntity(user);
  }

  async findAll(companyId: string): Promise<UserEntity[]> {
    const users = await prisma.user.findMany({
      where: { companyId },
      include: {
        role: {
          include: { permissions: true }
        }
      }
    });
    return users.map(user => new UserEntity(user));
  }
}
