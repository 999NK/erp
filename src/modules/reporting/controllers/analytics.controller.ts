import { Request, Response } from 'express';
import { FinancialAnalyticsService } from '../services/financial-analytics.service';
import { CommercialAnalyticsService } from '../services/commercial-analytics.service';
import { InventoryAnalyticsService } from '../services/inventory-analytics.service';

export class AnalyticsController {
  constructor(
    private readonly financialAnalytics: FinancialAnalyticsService,
    private readonly commercialAnalytics: CommercialAnalyticsService,
    private readonly inventoryAnalytics: InventoryAnalyticsService
  ) {}

  async getExecutiveDashboard(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      // Gather high-level KPIs across modules
      
      const [financialSummary, commercialSummary, inventorySummary] = await Promise.all([
        this.financialAnalytics.getFinancialSummary(companyId),
        this.commercialAnalytics.getCommercialSummary(companyId),
        this.inventoryAnalytics.getInventorySummary(companyId)
      ]);

      res.status(200).json({
        success: true,
        data: {
          financial: financialSummary,
          commercial: commercialSummary,
          inventory: inventorySummary
        }
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getFinancialAnalytics(req: Request, res: Response) {
    try {
      const data = await this.financialAnalytics.getDetailedAnalytics(req.user.companyId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getCommercialAnalytics(req: Request, res: Response) {
    try {
      const data = await this.commercialAnalytics.getDetailedAnalytics(req.user.companyId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
