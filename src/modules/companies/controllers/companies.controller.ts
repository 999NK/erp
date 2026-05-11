import { Request, Response } from 'express';
import { CompaniesService } from '../services/companies.service';

export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      // Isolando as regras de parsing e interface do protocolo HTTP
      const company = await this.companiesService.createCompany(req.body);
      res.status(201).json({ success: true, data: company });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
