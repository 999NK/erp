import { Request, Response } from 'express';
import { AccountPayablesService } from '../services/payable.service';

export class AccountPayablesController {
  constructor(private readonly service: AccountPayablesService) {}

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
      const filters = req.query; 
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

  async pay(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = {
        ...req.body,
        payableId: id,
        companyId: req.user.companyId,
        userId: req.user.id
      };
      const result = await this.service.pay(data);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
