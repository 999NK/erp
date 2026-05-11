import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SupplierController {
  async create(req: Request, res: Response) {
    try {
      const data = req.body;
      const supplier = await prisma.supplier.create({
        data: {
          companyId: req.user.companyId,
          name: data.name,
          businessName: data.businessName,
          document: data.document,
          email: data.email,
          mobilePhone: data.mobilePhone,
          landline: data.landline,
          zipCode: data.zipCode,
          street: data.street,
          number: data.number,
          complement: data.complement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          stateRegistration: data.stateRegistration,
          municipalRegistration: data.municipalRegistration,
          foundationDate: data.foundationDate ? new Date(data.foundationDate) : null,
          tags: data.tags,
          notes: data.notes,
          pixKey: data.pixKey,
          bankAccount: data.bankAccount,
          category: data.category,
          averageDeliveryTime: data.averageDeliveryTime ? parseInt(data.averageDeliveryTime, 10) : null,
          contractUrl: data.contractUrl,
          isActive: data.isActive !== undefined ? data.isActive : true
        }
      });
      res.status(201).json({ success: true, data: supplier });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { search, status } = req.query;
      let whereClause: any = { companyId: req.user.companyId };

      if (search) {
        whereClause.OR = [
          { name: { contains: String(search) } },
          { businessName: { contains: String(search) } },
          { document: { contains: String(search) } },
          { email: { contains: String(search) } }
        ];
      }

      if (status) {
        whereClause.isActive = status === 'active';
      }

      const suppliers = await prisma.supplier.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json({ success: true, data: suppliers });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
