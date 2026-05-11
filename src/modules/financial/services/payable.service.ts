import { IAccountPayableRepository } from '../interfaces/payable.repository.interface';
import { CreateAccountPayableDTO, PayPayableDTO } from '../dto/payable.dto';

export class AccountPayablesService {
  constructor(private readonly repository: IAccountPayableRepository) {}

  async create(data: CreateAccountPayableDTO) {
    if (!data.amount || Number(data.amount) <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    if (!data.dueDate) {
      throw new Error('Due date is required');
    }
    return await this.repository.create(data);
  }

  async findById(id: string, companyId: string) {
    return await this.repository.findById(id, companyId);
  }

  async list(companyId: string, filters?: any) {
    return await this.repository.list(companyId, filters);
  }

  async pay(data: PayPayableDTO) {
    if (!data.accountId) throw new Error('Source financial account is required');
    if (!data.amount || Number(data.amount) <= 0) throw new Error('Amount must be greater than zero');
    
    return await this.repository.pay(data);
  }
}
