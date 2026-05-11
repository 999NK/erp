import { Request, Response } from 'express';
import { SalesService } from '../services/sales.service';
import { RegisterSaleDTO } from '../dto/register-sale.dto';

export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  async createSale(req: Request, res: Response): Promise<void> {
    try {
      const dto: RegisterSaleDTO = {
        companyId: req.user.companyId,
        userId: req.user.id,
        sessionId: req.body.sessionId,
        items: req.body.items,
        payments: req.body.payments,
      };

      const sale = await this.salesService.processSale(dto);
      res.status(201).json({ success: true, data: sale });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async openSession(req: Request, res: Response): Promise<void> {
    try {
      const { initialBalance } = req.body;
      const session = await this.salesService.openSession(req.user.companyId, req.user.id, initialBalance);
      res.status(201).json({ success: true, data: session });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async closeSession(req: Request, res: Response): Promise<void> {
    try {
      const { finalBalance } = req.body;
      const { sessionId } = req.params;
      const session = await this.salesService.closeSession(req.user.companyId, req.user.id, sessionId, finalBalance);
      res.status(200).json({ success: true, data: session });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const session = await this.salesService.getSession(req.user.companyId, req.user.id);
      res.status(200).json({ success: true, data: session });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async listSales(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, startDate, endDate, customerId } = req.query;
      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        customerId: customerId as string,
      };
      
      const sales = await this.salesService.getSales(
        req.user.companyId, 
        Number(page), 
        Number(limit),
        filters
      );
      
      res.status(200).json({ success: true, ...sales });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async registerCashMovement(req: Request, res: Response): Promise<void> {
    try {
        await this.salesService.registerCashMovement({
            companyId: req.user.companyId,
            userId: req.user.id,
            sessionId: req.body.sessionId,
            type: req.body.type,
            amount: req.body.amount,
            description: req.body.description
        });
        res.status(201).json({ success: true, message: 'Movement registered successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
  }
}
