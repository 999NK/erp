import { prisma } from '../../../shared/infra/database/prisma';

export class ProductTypesService {
  async create(companyId: string, data: { name: string; color?: string; slug?: string }) {
    const defaultSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return prisma.productType.create({
      data: {
        companyId,
        name: data.name,
        color: data.color,
        slug: data.slug || defaultSlug
      }
    });
  }

  async findAll(companyId: string) {
    return prisma.productType.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  async update(id: string, companyId: string, data: any) {
    // secure it
    const existing = await prisma.productType.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) throw new Error('Not found');
    
    return prisma.productType.update({
      where: { id },
      data
    });
  }

  async delete(id: string, companyId: string) {
    const existing = await prisma.productType.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) throw new Error('Not found');

     return prisma.productType.update({
       where: { id },
       data: { isActive: false }
     });
  }
}
