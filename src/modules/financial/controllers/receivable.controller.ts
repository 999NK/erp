import { Request, Response } from 'express';
import { AccountReceivablesService } from '../services/receivable.service';

export class AccountReceivablesController {
  constructor(private readonly service: AccountReceivablesService) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = {
        ...req.body,
        companyId: req.user.companyId,
      };
      const result = await this.service.create(data);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const filters = req.query; // e.g. status, customerId
      const list = await this.service.list(req.user.companyId, filters);
      res.status(200).json({ success: true, data: list });
    } catch (error: any) {
       res.status(400).json({ success: false, message: error.message });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.service.findById(id, req.user.companyId);
      if (!result) {
        res.status(404).json({ success: false, message: 'Not found' });
        return;
      }
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
       res.status(400).json({ success: false, message: error.message });
    }
  }

  async receive(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = {
        ...req.body,
        receivableId: id,
        companyId: req.user.companyId,
        userId: req.user.id
      };
      const result = await this.service.receivePayment(data);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
