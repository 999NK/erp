import { IProductsRepository } from '../interfaces/product.repository.interface';
import { CreateProductDTO } from '../dto/create-product.dto';
import { UpdateProductDTO } from '../dto/update-product.dto';
import { ProductEntity } from '../entities/product.entity';

export class ProductsService {
  constructor(private readonly productsRepository: IProductsRepository) {}

  async createProduct(data: CreateProductDTO): Promise<ProductEntity> {
    const product = new ProductEntity({
      companyId: data.companyId,
      name: data.name,
      sku: data.sku,
      barcode: data.barcode,
      price: data.price,
      costPrice: data.costPrice,
      margin: data.margin,
      unit: data.unit ?? 'UN',
      type: data.type ?? 'PRODUCT',
      categoryId: data.categoryId,
      ncm: data.ncm,
      cest: data.cest,
      cfop: data.cfop,
      notes: data.notes,
      minStock: data.minStock ?? 0,
      allowNegativeStock: data.allowNegativeStock ?? false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.productsRepository.create(product);
  }

  async getAllProducts(companyId: string, filters?: { search?: string; page?: number; limit?: number }): Promise<ProductEntity[]> {
    return this.productsRepository.findAll(companyId, filters);
  }

  async getProductById(id: string, companyId: string): Promise<ProductEntity> {
    const product = await this.productsRepository.findById(id, companyId);
    if (!product) {
      throw new Error('Product not found or not owned by company.');
    }
    return product;
  }

  async updateProduct(id: string, companyId: string, data: UpdateProductDTO, userId?: string): Promise<ProductEntity> {
    const existingProduct = await this.getProductById(id, companyId); // Ensure it exists

    // Record price history if price changed
    if (data.price !== undefined && data.price !== existingProduct.price && userId) {
      const { prisma } = await import('../../../shared/infra/database/prisma');
      await prisma.productPriceHistory.create({
        data: {
          companyId,
          productId: id,
          userId,
          oldPrice: existingProduct.price,
          newPrice: data.price,
          percentageApplied: data.percentageApplied,
          reason: data.reason || 'Alteração manual no cadastro'
        }
      });
    }
    
    // We don't want to pass reason and percentageApplied to the repository if it complains, but Prisma ignores unknown fields sometimes, or the repository uses specific fields. Let's clean the data.
    const { reason, percentageApplied, ...updateData } = data;

    return this.productsRepository.update(id, companyId, updateData as any);
  }

  async getPriceHistory(id: string, companyId: string) {
    const { prisma } = await import('../../../shared/infra/database/prisma');
    return prisma.productPriceHistory.findMany({
      where: { companyId, productId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async deleteProduct(id: string, companyId: string): Promise<void> {
    await this.getProductById(id, companyId); // Ensure it exists
    return this.productsRepository.delete(id, companyId);
  }
}
