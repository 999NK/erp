import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CommercialAnalyticsService {
  async getCommercialSummary(companyId: string) {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const monthSales = await prisma.sale.aggregate({
      where: { companyId, status: 'COMPLETED', createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
      _count: { id: true }
    });

    const totalRevenueMonth = monthSales._sum.totalAmount || 0;
    const totalTransactionsMonth = monthSales._count.id || 0;
    const averageTicket = totalTransactionsMonth > 0 ? totalRevenueMonth / totalTransactionsMonth : 0;

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7 days including today

    const recentSales = await prisma.sale.findMany({
      where: { companyId, status: 'COMPLETED', createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, totalAmount: true }
    });

    const trendMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
       const d = new Date(sevenDaysAgo);
       d.setDate(d.getDate() + i);
       const shortName = d.toLocaleDateString('pt-BR', { weekday: 'short' });
       trendMap.set(shortName, 0);
    }
    
    for (const s of recentSales) {
       const shortName = s.createdAt.toLocaleDateString('pt-BR', { weekday: 'short' });
       if (trendMap.has(shortName)) {
          trendMap.set(shortName, (trendMap.get(shortName) || 0) + s.totalAmount);
       }
    }

    const trend = Array.from(trendMap.entries()).map(([name, revenue]) => ({ name, revenue }));

    return {
      totalRevenueMonth,
      totalTransactionsMonth,
      averageTicket,
      trend
    };
  }

  async getDetailedAnalytics(companyId: string) {
     return {};
  }
}
