export abstract class BaseEntity {
  id!: string;          // UUID
  companyId?: string;   // Necessário para SaaS Multi-tenant. Será opcional apenas para metadados de sistema e auth
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date | null;
}
