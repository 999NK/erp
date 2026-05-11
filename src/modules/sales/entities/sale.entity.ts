export class SaleItemEntity {
  id!: string;
  saleId!: string;
  productId!: string;
  quantity!: number;
  unitPrice!: number;
  discount!: number;
  netPrice!: number;
  total!: number;
  productNameSnapshot!: string;
  skuSnapshot?: string | null;

  constructor(partial: Partial<SaleItemEntity>) {
    Object.assign(this, partial);
  }
}

export class SalePaymentEntity {
  id!: string;
  saleId!: string;
  method!: string; // "CASH", "CREDIT_CARD", "DEBIT_CARD", "PIX"
  amount!: number;

  constructor(partial: Partial<SalePaymentEntity>) {
    Object.assign(this, partial);
  }
}

export class SaleEntity {
  id!: string;
  companyId!: string;
  sessionId!: string;
  userId!: string;
  totalAmount!: number;
  discountAmount!: number;
  netAmount!: number;
  status!: string; // "COMPLETED", "CANCELED"
  cancelReason?: string | null;
  canceledAt?: Date | null;
  createdAt!: Date;

  items?: SaleItemEntity[];
  payments?: SalePaymentEntity[];

  constructor(partial: Partial<SaleEntity>) {
    Object.assign(this, partial);
    if (partial.items) {
      this.items = partial.items.map(i => new SaleItemEntity(i));
    }
    if (partial.payments) {
      this.payments = partial.payments.map(p => new SalePaymentEntity(p));
    }
  }
}
