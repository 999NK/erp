import { BaseEntity } from '../../../shared/domain/base.entity';

export class StockLocationEntity extends BaseEntity {
  name!: string;
  isDefault!: boolean;
  isActive!: boolean;

  constructor(partial: Partial<StockLocationEntity>) {
    super();
    Object.assign(this, partial);
    if (!this.companyId) {
      throw new Error('StockLocation must belong to a tenant (companyId is required).');
    }
  }
}
