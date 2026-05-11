import { Request, Response } from 'express';
import { ForecastService } from '../services/forecast.service';

export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  async getForecasts(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const forecasts = await this.forecastService.generateSimpleForecasts(companyId);
      
      res.status(200).json({
        success: true,
        data: forecasts
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
