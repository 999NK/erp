import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InventoryAnalyticsService {
  async getInventorySummary(companyId: string) {
    // Current valuation
    const stockItems = await prisma.stockSnapshot.findMany({
      where: { companyId },
      include: {
        product: { select: { costPrice: true, price: true } }
      }
    });

    let totalValuationCost = 0;
    let totalValuationRetail = 0;
    let criticalStockCount = 0;

    for (const item of stockItems) {
      const qty = item.quantity;
      if (qty <= 0) continue;
      
      const cost = item.product.costPrice || 0;
      const price = item.product.price || 0;

      totalValuationCost += (qty * cost);
      totalValuationRetail += (qty * price);

      if (qty < 10) { // simple threshold for now
        criticalStockCount++;
      }
    }

    return {
      totalValuationCost,
      totalValuationRetail,
      criticalStockCount,
      totalItemsInStock: stockItems.length
    };
  }
}
