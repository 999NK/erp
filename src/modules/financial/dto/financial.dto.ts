export interface CreateFinancialTransactionDTO {
  companyId: string;
  accountId: string;
  userId: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT';
  amount: number; // Signed amount, >0 for income, <0 for expense usually, or handle the sign within the service based on type. Wait, the schema says: Signed: > 0 Income, < 0 Expense. So the service must enforce it.
  categoryId?: string;
  costCenterId?: string;
  payableId?: string;
  receivableId?: string;
  description: string;
  reference?: string;
}

export interface FinancialDashboardSummaryDTO {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  cashBalance: number;
  flowChart?: { name: string; income: number; expense: number }[];
}
