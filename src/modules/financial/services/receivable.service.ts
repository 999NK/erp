import { IAccountReceivableRepository } from '../interfaces/receivable.repository.interface';
import { CreateAccountReceivableDTO, ReceivePaymentDTO } from '../dto/receivable.dto';

export class AccountReceivablesService {
  constructor(private readonly repository: IAccountReceivableRepository) {}

  async create(data: CreateAccountReceivableDTO) {
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

  async receivePayment(data: ReceivePaymentDTO) {
    if (!data.accountId) throw new Error('Target financial account is required');
    if (!data.amount || Number(data.amount) <= 0) throw new Error('Amount must be greater than zero');
    
    return await this.repository.receive(data);
  }
}
