export class StockMovementEntity {
  id!: string;
  companyId!: string;
  productId!: string;
  locationId!: string;
  userId!: string;
  type!: string; // "IN", "OUT", "ADJUSTMENT"
  quantity!: number;
  unitCost?: number | null;
  reference?: string | null;
  notes?: string | null;
  createdAt!: Date;

  constructor(partial: Partial<StockMovementEntity>) {
    Object.assign(this, partial);
  }
}
