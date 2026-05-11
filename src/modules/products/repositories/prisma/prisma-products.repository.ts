import { IProductsRepository } from '../../interfaces/product.repository.interface';
import { ProductEntity } from '../../entities/product.entity';
import { prisma } from '../../../../shared/infra/database/prisma';
import { ProductMapper } from '../../mappers/product.mapper';

export class PrismaProductsRepository implements IProductsRepository {
  async create(data: ProductEntity): Promise<ProductEntity> {
    const product = await prisma.product.create({
      data: {
        id: data.id,
        companyId: data.companyId,
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        price: data.price,
        costPrice: data.costPrice,
        margin: data.margin,
        unit: data.unit,
        type: data.type,
        categoryId: data.categoryId,
        ncm: data.ncm,
        cest: data.cest,
        cfop: data.cfop,
        notes: data.notes,
        minStock: data.minStock,
        allowNegativeStock: data.allowNegativeStock,
        isActive: data.isActive,
      },
    });
    return ProductMapper.toDomain(product);
  }

  async findById(id: string, companyId: string): Promise<ProductEntity | null> {
    const product = await prisma.product.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!product) return null;
    return ProductMapper.toDomain(product);
  }

  async findAll(companyId: string, filters?: { search?: string; page?: number; limit?: number }): Promise<ProductEntity[]> {
    const skip = filters?.page && filters?.limit ? (filters.page - 1) * filters.limit : undefined;
    const take = filters?.limit ? filters.limit : undefined;
    const search = filters?.search;

    const products = await prisma.product.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search } },
            { sku: { contains: search } },
            { barcode: { contains: search } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
    return products.map(ProductMapper.toDomain);
  }

  async update(id: string, companyId: string, data: Partial<ProductEntity>): Promise<ProductEntity> {
    const product = await prisma.product.update({
      where: { id },
      data,
    });
    return ProductMapper.toDomain(product);
  }

  async delete(id: string, companyId: string): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
