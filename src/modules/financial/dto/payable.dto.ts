export interface CreateAccountPayableDTO {
  companyId: string;
  supplierId?: string;
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

export interface PayPayableDTO {
  companyId: string;
  userId: string;
  payableId: string;
  accountId: string; // which bank account it was paid from
  amount: string | number; // base amount paid
  discountAmount?: string | number;
  interestAmount?: string | number;
  penaltyAmount?: string | number;
}
