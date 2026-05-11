import { CompanyEntity } from '../entities/company.entity';

// Contrato de acoplamento do banco de dados (Abaixo disso vem o Prisma no futuro)
export interface ICompaniesRepository {
  create(data: CompanyEntity): Promise<CompanyEntity>;
  findById(id: string): Promise<CompanyEntity | null>;
  findByDocument(document: string): Promise<CompanyEntity | null>;
  update(id: string, data: Partial<CompanyEntity>): Promise<CompanyEntity>;
}
