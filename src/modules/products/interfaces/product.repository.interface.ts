import { ProductEntity } from '../entities/product.entity';

export interface IProductsRepository {
  create(data: ProductEntity): Promise<ProductEntity>;
  findById(id: string, companyId: string): Promise<ProductEntity | null>;
  findAll(companyId: string, filters?: { search?: string; page?: number; limit?: number }): Promise<ProductEntity[]>;
  update(id: string, companyId: string, data: Partial<ProductEntity>): Promise<ProductEntity>;
  delete(id: string, companyId: string): Promise<void>;
}

