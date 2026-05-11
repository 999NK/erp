import { FinancialTransactionEntity, FinancialAccountEntity } from '../entities/financial.entity';
import { CreateFinancialTransactionDTO, FinancialDashboardSummaryDTO } from '../dto/financial.dto';

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  userId?: string;
  type?: string;
  reference?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface IFinancialRepository {
  createTransaction(data: CreateFinancialTransactionDTO): Promise<FinancialTransactionEntity>;
  getAccounts(companyId: string): Promise<FinancialAccountEntity[]>;
  getTransactionHistory(companyId: string, filters: TransactionFilters): Promise<FinancialTransactionEntity[]>;
  getDashboardSummary(companyId: string): Promise<FinancialDashboardSummaryDTO>;
}
