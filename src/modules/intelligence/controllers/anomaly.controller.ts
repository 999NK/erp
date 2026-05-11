import { Request, Response } from 'express';
import { AnomalyService } from '../services/anomaly.service';

export class AnomalyController {
  constructor(private readonly anomalyService: AnomalyService) {}

  async getAlerts(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const alerts = await this.anomalyService.getAlerts(companyId);
      
      res.status(200).json({
        success: true,
        data: alerts
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  
  async detectAnomalies(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      // In real scenario this would run via a job/cron
      await this.anomalyService.detectAnomalies(companyId);
      
      res.status(200).json({
        success: true,
        message: 'Anomaly detection completed'
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
