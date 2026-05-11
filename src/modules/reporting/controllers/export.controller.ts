import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ExportController {
  
  async requestExport(req: Request, res: Response) {
    try {
      const { type, format, filters } = req.body;
      const companyId = req.user.companyId;
      const userId = req.user.id;

      // Create an export record with new schema
      const report = await prisma.reportExport.create({
        data: {
          companyId,
          requestedByUserId: userId,
          type,
          format,
          status: 'QUEUED',
          filters: filters ? JSON.stringify(filters) : null
        }
      });

      res.status(202).json({ success: true, message: 'Export scheduled successfully', data: report });
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async listExports(req: Request, res: Response) {
    try {
      const exportsList = await prisma.reportExport.findMany({
        where: { companyId: req.user.companyId },
        orderBy: { createdAt: 'desc' },
        take: 30
      });
      res.status(200).json({ success: true, data: exportsList });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async downloadReport(req: Request, res: Response) {
    try {
      const { storageKey } = req.params;
      
      // Basic security check to prevent directory traversal
      if (!storageKey || storageKey.includes('/') || storageKey.includes('..')) {
        return res.status(400).send('Invalid storage key');
      }

      const report = await prisma.reportExport.findFirst({
        where: { storageKey }
      });

      if (!report) {
        return res.status(404).send('Report not found');
      }

      // Usually auth checking via cookies/session here, doing simplified auth check via URL
      const path = require('path');
      const fs = require('fs');

      const filePath = path.join(process.cwd(), 'dist', 'public', 'reports', storageKey);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found on system');
      }

      const contentType = report.format === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${storageKey}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).send('Internal server error');
    }
  }
}
