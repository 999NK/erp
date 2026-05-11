export interface CreateAccountReceivableDTO {
  companyId: string;
  customerId?: string;
  description: string;
  categoryId?: string;
  costCenterId?: string;
  accountId?: string;
  amount: string | number;
  dueDate: string;
  accrualDate?: string;
  issueDate?: string;
  interestAmount?: string | number;
  penaltyAmount?: string | number;
  discountAmount?: string | number;
  notes?: string;
  reference?: string;
}

export interface ReceivePaymentDTO {
  companyId: string;
  userId: string;
  receivableId: string;
  accountId: string; // which bank account it went into
  amount: string | number; // base amount
  discountAmount?: string | number;
  interestAmount?: string | number;
  penaltyAmount?: string | number;
}
