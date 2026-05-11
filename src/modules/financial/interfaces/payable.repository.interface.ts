import { CreateAccountPayableDTO, PayPayableDTO } from '../dto/payable.dto';

export interface IAccountPayableRepository {
  create(data: CreateAccountPayableDTO): Promise<any>;
  findById(id: string, companyId: string): Promise<any>;
  list(companyId: string, filters?: any): Promise<any[]>;
  pay(data: PayPayableDTO): Promise<any>;
}
