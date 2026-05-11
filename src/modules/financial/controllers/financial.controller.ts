import { Request, Response } from 'express';
import { FinancialService } from '../services/financial.service';

export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const data = {
        ...req.body,
        companyId: req.user.companyId,
        userId: req.user.id,
      };
      const result = await this.financialService.createTransaction(data);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAccounts(req: Request, res: Response): Promise<void> {
    try {
      const accounts = await this.financialService.getAccounts(req.user.companyId);
      res.status(200).json({ success: true, data: accounts });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        accountId: req.query.accountId as string,
        categoryId: req.query.categoryId as string,
        userId: req.query.userId as string,
        type: req.query.type as string,
        reference: req.query.reference as string,
        minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
        maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };
      
      const history = await this.financialService.getTransactionHistory(req.user.companyId, filters);
      res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await this.financialService.getDashboardSummary(req.user.companyId);
      res.status(200).json({ success: true, data: summary });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      let type = req.query.type as string | undefined;
      const categories = await prisma.financialCategory.findMany({
        where: { companyId: req.user.companyId, isActive: true, ...(type ? { type } : {}) }
      });
      res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getCostCenters(req: Request, res: Response): Promise<void> {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const centers = await prisma.costCenter.findMany({
        where: { companyId: req.user.companyId, isActive: true }
      });
      res.status(200).json({ success: true, data: centers });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
