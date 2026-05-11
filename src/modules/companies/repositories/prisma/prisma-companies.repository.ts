import { ICompaniesRepository } from '../companies.repository';
import { CompanyEntity } from '../../entities/company.entity';
import { prisma } from '../../../../shared/infra/database/prisma';

export class PrismaCompaniesRepository implements ICompaniesRepository {
  async create(data: CompanyEntity): Promise<CompanyEntity> {
    const company = await prisma.company.create({
      data: {
        id: data.id,
        businessName: data.businessName,
        tradeName: data.tradeName,
        document: data.document,
        isActive: data.isActive,
      },
    });
    return new CompanyEntity(company);
  }

  async findById(id: string): Promise<CompanyEntity | null> {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return null;
    return new CompanyEntity(company);
  }

  async findByDocument(document: string): Promise<CompanyEntity | null> {
    const company = await prisma.company.findUnique({ where: { document } });
    if (!company) return null;
    return new CompanyEntity(company);
  }

  async update(id: string, data: Partial<CompanyEntity>): Promise<CompanyEntity> {
    const company = await prisma.company.update({
      where: { id },
      data,
    });
    return new CompanyEntity(company);
  }
}
