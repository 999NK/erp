import { IFinancialRepository, TransactionFilters } from '../../interfaces/financial.repository.interface';
import { CreateFinancialTransactionDTO, FinancialDashboardSummaryDTO } from '../../dto/financial.dto';
import { FinancialTransactionEntity, FinancialAccountEntity } from '../../entities/financial.entity';
import { prisma } from '../../../../shared/infra/database/prisma';

export class PrismaFinancialRepository implements IFinancialRepository {
  async createTransaction(data: CreateFinancialTransactionDTO): Promise<FinancialTransactionEntity> {
    return await prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.financialTransaction.create({
        data: {
          companyId: data.companyId,
          accountId: data.accountId,
          userId: data.userId,
          type: data.type,
          amount: data.amount,
          categoryId: data.categoryId,
          costCenterId: data.costCenterId,
          payableId: data.payableId,
          receivableId: data.receivableId,
          description: data.description,
          reference: data.reference,
        }
      });

      // Update Account Balance Materialized View
      await tx.financialAccount.update({
        where: { id: data.accountId },
        data: {
          balance: { increment: data.amount }
        }
      });

      // If it's a payable payment, update that specific payable
      if (data.payableId) {
        const payable = await tx.accountPayable.findUnique({ where: { id: data.payableId } });
        if (payable) {
           const newPaid = payable.paidAmount + Math.abs(data.amount);
           const status = newPaid >= payable.amount ? 'PAID' : 'PARTIAL';
           await tx.accountPayable.update({
             where: { id: data.payableId },
             data: { paidAmount: newPaid, status, paidDate: status === 'PAID' ? new Date() : undefined }
           });
        }
      }

      // If it's a receivable payment, update that specific receivable
      if (data.receivableId) {
        const receivable = await tx.accountReceivable.findUnique({ where: { id: data.receivableId } });
        if (receivable) {
           const newReceived = receivable.receivedAmount + Math.abs(data.amount);
           const status = newReceived >= receivable.amount ? 'RECEIVED' : 'PARTIAL';
           await tx.accountReceivable.update({
             where: { id: data.receivableId },
             data: { receivedAmount: newReceived, status, receivedDate: status === 'RECEIVED' ? new Date() : undefined }
           });
        }
      }

      return new FinancialTransactionEntity(transaction);
    });
  }

  async getAccounts(companyId: string): Promise<FinancialAccountEntity[]> {
    const accounts = await prisma.financialAccount.findMany({
      where: { companyId, isActive: true },
    });
    return accounts.map(a => new FinancialAccountEntity(a));
  }

  async getTransactionHistory(companyId: string, filters: TransactionFilters): Promise<FinancialTransactionEntity[]> {
    const whereClause: any = { companyId };
    
    if (filters.accountId) whereClause.accountId = filters.accountId;
    if (filters.categoryId) whereClause.categoryId = filters.categoryId;
    if (filters.userId) whereClause.userId = filters.userId;
    if (filters.type) whereClause.type = filters.type;
    if (filters.reference) whereClause.reference = { contains: filters.reference };
    
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      whereClause.amount = {};
      if (filters.minAmount !== undefined) whereClause.amount.gte = filters.minAmount;
      if (filters.maxAmount !== undefined) whereClause.amount.lte = filters.maxAmount;
    }
    
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) whereClause.createdAt.lte = new Date(filters.endDate);
    }
    
    const transactions = await prisma.financialTransaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      include: {
        account: true,
        category: true,
        user: { select: { id: true, name: true } }
      }
    });
    return transactions.map(t => new FinancialTransactionEntity(t));
  }

  async getDashboardSummary(companyId: string): Promise<FinancialDashboardSummaryDTO> {
    // Highly optimized real-world approach instead of summing in memory
    const agg = await prisma.financialTransaction.groupBy({
      by: ['type'],
      where: { companyId },
      _sum: {
        amount: true
      }
    });

    let totalRevenue = 0;
    let totalExpenses = 0;

    agg.forEach(group => {
      const sum = group._sum.amount || 0;
      if (group.type === 'INCOME') totalRevenue += sum;
      if (group.type === 'EXPENSE') totalExpenses += Math.abs(sum); // ensure logic remains correct
    });

    const accounts = await prisma.financialAccount.aggregate({
        where: { companyId, isActive: true },
        _sum: { balance: true }
    });

    const today = new Date();
    today.setHours(0,0,0,0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const recentTransactions = await prisma.financialTransaction.findMany({
      where: { companyId, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, type: true, amount: true }
    });

    const flowChartMap = new Map<string, { income: number; expense: number }>();
    for (let i = 0; i < 7; i++) {
       const d = new Date(sevenDaysAgo);
       d.setDate(d.getDate() + i);
       const shortName = d.toLocaleDateString('pt-BR', { weekday: 'short' });
       flowChartMap.set(shortName, { income: 0, expense: 0 });
    }

    for (const t of recentTransactions) {
       const shortName = t.createdAt.toLocaleDateString('pt-BR', { weekday: 'short' });
       const point = flowChartMap.get(shortName);
       if (point) {
          if (t.type === 'INCOME') point.income += t.amount;
          if (t.type === 'EXPENSE') point.expense += Math.abs(t.amount);
       }
    }

    const flowChart = Array.from(flowChartMap.entries()).map(([name, data]) => ({ name, income: data.income, expense: data.expense }));

    return {
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      cashBalance: accounts._sum.balance || 0,
      flowChart
    };
  }
}
