export class FinancialTransactionEntity {
  id!: string;
  companyId!: string;
  accountId!: string;
  userId!: string;
  type!: string; // "INCOME", "EXPENSE", "TRANSFER", "ADJUSTMENT"
  amount!: number;
  categoryId?: string | null;
  costCenterId?: string | null;
  payableId?: string | null;
  receivableId?: string | null;
  description!: string;
  reference?: string | null;
  createdAt!: Date;

  constructor(partial: Partial<FinancialTransactionEntity>) {
    Object.assign(this, partial);
  }
}

export class FinancialAccountEntity {
  id!: string;
  companyId!: string;
  name!: string;
  type!: string; // "BANK_ACCOUNT", "CASH", "CREDIT_CARD"
  isActive!: boolean;
  balance!: number;

  constructor(partial: Partial<FinancialAccountEntity>) {
    Object.assign(this, partial);
  }
}
