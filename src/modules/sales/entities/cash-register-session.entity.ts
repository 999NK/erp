export class CashRegisterSessionEntity {
  id!: string;
  companyId!: string;
  userId!: string;
  openedAt!: Date;
  closedAt?: Date | null;
  initialBalance!: number;
  finalBalance?: number | null;
  status!: string; // "OPEN", "CLOSED"
  createdAt!: Date;

  constructor(partial: Partial<CashRegisterSessionEntity>) {
    Object.assign(this, partial);
  }
}
