import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnomalyService {
  async getAlerts(companyId: string) {
    return prisma.anomalyAlert.findMany({
      where: { companyId, isResolved: false },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  async detectAnomalies(companyId: string) {
    // Simulated anomaly detection logic based on stock points vs sales speed
    const slowMovingProducts = await prisma.stockSnapshot.findMany({
      where: { companyId },
      include: { product: true }
    });
    
    // Find products out of stock
    const criticalStock = slowMovingProducts.filter(item => item.quantity <= 0);

    for (const item of criticalStock) {
      await this.upsertAlert(
        companyId,
        'STOCKOUT',
        'CRITICAL',
        `Produto ${item.product.name} está em ruptura de estoque e impactando vendas.`
      );
    }
  }

  private async upsertAlert(companyId: string, type: string, severity: string, message: string) {
     const exists = await prisma.anomalyAlert.findFirst({
        where: { companyId, type, message, isResolved: false }
     });

     if (!exists) {
        await prisma.anomalyAlert.create({
           data: {
              companyId, type, severity, message
           }
        });
     }
  }
}
