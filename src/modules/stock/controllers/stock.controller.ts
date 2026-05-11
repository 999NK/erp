import { Request, Response } from 'express';
import { StockService } from '../services/stock.service';
import { RegisterMovementDTO } from '../dto/register-movement.dto';

export class StockController {
  constructor(private readonly stockService: StockService) {}

  async createMovement(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.id;
      const dto: RegisterMovementDTO = { ...req.body, companyId, userId };
      
      const result = await this.stockService.registerMovement(dto);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getSnapshots(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user.companyId;
      const { productId, locationId } = req.query as any;

      const snapshots = await this.stockService.getInventorySnapshots(companyId, { productId, locationId });
      res.status(200).json({ success: true, data: snapshots });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMovements(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user.companyId;
      const { productId, type } = req.query as any;

      const movements = await this.stockService.getMovementsHistory(companyId, { productId, type });
      res.status(200).json({ success: true, data: movements });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getLocations(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user.companyId;
      const locations = await this.stockService.getLocations(companyId);
      res.status(200).json({ success: true, data: locations });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
