import { UserEntity } from '../entities/user.entity';

export interface IUsersRepository {
  create(data: UserEntity): Promise<UserEntity>;
  findByEmail(email: string, companyId: string): Promise<UserEntity | null>;
  findById(id: string, companyId: string): Promise<UserEntity | null>;
  findAll(companyId: string): Promise<UserEntity[]>;
  // Sempre passando companyId para garantir o isolamento Multi-tenant
}
