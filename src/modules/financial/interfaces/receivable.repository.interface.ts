import { CreateAccountReceivableDTO, ReceivePaymentDTO } from '../dto/receivable.dto';

export interface IAccountReceivableRepository {
  create(data: CreateAccountReceivableDTO): Promise<any>;
  findById(id: string, companyId: string): Promise<any>;
  list(companyId: string, filters?: any): Promise<any[]>;
  receive(data: ReceivePaymentDTO): Promise<any>;
}
