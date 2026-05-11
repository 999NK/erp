import { BaseEntity } from '../../../shared/domain/base.entity';

export class CompanyEntity extends BaseEntity {
  businessName!: string;   // Razão Social
  tradeName?: string;      // Nome Fantasia
  document!: string;       // CNPJ ou CPF
  isActive!: boolean;

  constructor(partial: Partial<CompanyEntity>) {
    super();
    Object.assign(this, partial);
  }
}
