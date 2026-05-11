import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ForecastService {
  async generateSimpleForecasts(companyId: string) {
    // Basic Moving Average forecasting for demonstration
    // Instead of querying historical daily snapshots (as if we have months of data),
    // we'll try to aggregate current recent data from real Operational tables.

    const today = new Date();
    today.setHours(0,0,0,0);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Sales over last 7 days
    const recentSales = await prisma.sale.aggregate({
      where: {
        companyId,
        status: 'COMPLETED',
        createdAt: { gte: sevenDaysAgo }
      },
      _sum: { totalAmount: true }
    });
    
    const averageDailyRevenue = (recentSales._sum.totalAmount || 0) / 7;
    const projectedNext7DaysRevenue = averageDailyRevenue * 7;

    return {
      revenueForecast: {
        next7Days: projectedNext7DaysRevenue,
        trend: 'STABLE', // Could be UP, DOWN depending on calculation
        confidence: 0.75
      },
      cashflowForecast: {
         // rough estimation
         projectedBalance: (averageDailyRevenue * 7) * 0.8
      }
    };
  }
}
