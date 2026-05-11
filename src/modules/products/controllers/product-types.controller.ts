import { Request, Response } from 'express';
import { ProductTypesService } from '../services/product-types.service';

export class ProductTypesController {
  constructor(private readonly service: ProductTypesService) {}

  async create(req: Request, res: Response) {
    try {
      const data = await this.service.create(req.user.companyId, req.body);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const data = await this.service.findAll(req.user.companyId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = await this.service.update(req.params.id, req.user.companyId, req.body);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await this.service.delete(req.params.id, req.user.companyId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
