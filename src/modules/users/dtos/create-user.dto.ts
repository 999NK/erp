export interface CreateUserDTO {
  companyId: string;
  name: string;
  email: string;
  passwordString: string; // Plain password before hashing
  roleName?: string;
  creatorRole?: string;
  roleId?: string | null;
  branchId?: string | null;
  requirePasswordChange?: boolean;
  mfaEnabled?: boolean;
  expiresAt?: Date | null;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}
