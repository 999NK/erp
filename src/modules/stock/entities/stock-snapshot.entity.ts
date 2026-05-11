export class StockSnapshotEntity {
  id!: string;
  companyId!: string;
  productId!: string;
  locationId!: string;
  quantity!: number;
  lastCost?: number | null;
  updatedAt!: Date;

  constructor(partial: Partial<StockSnapshotEntity>) {
    Object.assign(this, partial);
  }
}
