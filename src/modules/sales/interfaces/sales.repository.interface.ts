import { SaleEntity } from '../entities/sale.entity';
import { RegisterSaleDTO } from '../dto/register-sale.dto';
import { CashRegisterSessionEntity } from '../entities/cash-register-session.entity';

export interface ISalesRepository {
  registerSaleTransaction(data: RegisterSaleDTO, stockLocationId: string): Promise<SaleEntity>;
  findSessionById(sessionId: string, companyId: string): Promise<CashRegisterSessionEntity | null>;
  openSession(companyId: string, userId: string, initialBalance: number): Promise<CashRegisterSessionEntity>;
  closeSession(sessionId: string, companyId: string, finalBalance: number): Promise<CashRegisterSessionEntity>;
  getActiveSession(companyId: string, userId: string): Promise<CashRegisterSessionEntity | null>;
}
