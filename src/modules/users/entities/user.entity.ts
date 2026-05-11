import { BaseEntity } from '../../../shared/domain/base.entity';

export class UserEntity extends BaseEntity {
  name!: string;
  email!: string;
  passwordHash!: string;
  roleId?: string | null;
  roleName?: string;
  permissions?: string | null;
  branchId?: string | null;
  requirePasswordChange?: boolean;
  mfaEnabled?: boolean;
  expiresAt?: Date | null;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive!: boolean;

  role?: {
    name: string;
    permissions?: { permissionKey: string }[];
  } | null;

  constructor(partial: Partial<UserEntity>) {
    super();
    Object.assign(this, partial);
    
    if (!this.companyId) {
      throw new Error('User must belong to a tenant (companyId is required).');
    }
  }
}
