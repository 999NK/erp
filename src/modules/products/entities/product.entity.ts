import { BaseEntity } from '../../../shared/domain/base.entity';

export class ProductEntity extends BaseEntity {
  name!: string;
  sku?: string | null;
  barcode?: string | null;
  price!: number;
  costPrice?: number | null;
  margin?: number | null;
  unit!: string;
  type!: string;
  categoryId?: string | null;
  ncm?: string | null;
  cest?: string | null;
  cfop?: string | null;
  notes?: string | null;
  minStock!: number;
  allowNegativeStock!: boolean;
  isActive!: boolean;

  constructor(partial: Partial<ProductEntity>) {
    super();
    Object.assign(this, partial);
    
    if (!this.companyId) {
      throw new Error('Product must belong to a tenant (companyId is required).');
    }
  }
}
