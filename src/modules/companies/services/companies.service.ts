import { ICompaniesRepository } from '../repositories/companies.repository';
import { CreateCompanyDTO } from '../dtos/create-company.dto';
import { CompanyEntity } from '../entities/company.entity';
import { prisma } from '../../../shared/infra/database/prisma';
import bcrypt from 'bcryptjs';

export class CompaniesService {
  constructor(private readonly companiesRepository: ICompaniesRepository) {}

  async createCompany(data: CreateCompanyDTO): Promise<CompanyEntity> {
    const existingCompany = await this.companiesRepository.findByDocument(data.document);
    if (existingCompany) {
      throw new Error('A company with this document already exists.');
    }

    const company = new CompanyEntity({
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createdCompany = await this.companiesRepository.create(company);

    // Create default roles and users
    const passwordHash = await bcrypt.hash('123456', 8);
    
    // Create Default Roles
    const adminRole = await prisma.role.create({
      data: { companyId: createdCompany.id, name: 'ADMIN', description: 'System Admin' }
    });
    const managerRole = await prisma.role.create({
      data: { companyId: createdCompany.id, name: 'MANAGER', description: 'Manager Template' }
    });
    const employeeRole = await prisma.role.create({
      data: { companyId: createdCompany.id, name: 'EMPLOYEE', description: 'Employee Template' }
    });

    // Create Default Users
    await prisma.user.createMany({
      data: [
        {
          companyId: createdCompany.id,
          name: 'System Admin',
          email: 'admin@company.com',
          passwordHash,
          roleId: adminRole.id,
          roleName: 'ADMIN',
          position: 'Administrador do Sistema',
        },
        {
          companyId: createdCompany.id,
          name: 'Manager Template',
          email: 'manager@company.com',
          passwordHash,
          roleId: managerRole.id,
          roleName: 'MANAGER',
          position: 'Gerente Geral',
        },
        {
          companyId: createdCompany.id,
          name: 'Employee Template',
          email: 'employee@company.com',
          passwordHash,
          roleId: employeeRole.id,
          roleName: 'EMPLOYEE',
          position: 'Caixa',
        }
      ]
    });

    return createdCompany;
  }
}
