import { IFinancialRepository } from '../interfaces/financial.repository.interface';
import { CreateFinancialTransactionDTO } from '../dto/financial.dto';

export class FinancialService {
  constructor(private readonly financialRepository: IFinancialRepository) {}

  async createTransaction(data: CreateFinancialTransactionDTO) {
    if (!data.amount) throw new Error('Amount cannot be zero');
    if (!data.accountId) throw new Error('Account is required');
    if (!data.description) throw new Error('Description is required');

    // Enforce signs to guarantee ledger consistency
    if (data.type === 'INCOME' && data.amount <= 0) {
       throw new Error('INCOME must have a positive amount');
    }
    if (data.type === 'EXPENSE' && data.amount >= 0) {
       throw new Error('EXPENSE must have a negative amount');
    }

    return await this.financialRepository.createTransaction(data);
  }

  async getAccounts(companyId: string) {
    return await this.financialRepository.getAccounts(companyId);
  }

  async getTransactionHistory(companyId: string, filters: any = {}) {
    return await this.financialRepository.getTransactionHistory(companyId, filters);
  }

  async getDashboardSummary(companyId: string) {
    return await this.financialRepository.getDashboardSummary(companyId);
  }
}
