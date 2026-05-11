import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CustomerController {
  async create(req: Request, res: Response) {
    try {
      const data = req.body;
      const customer = await prisma.customer.create({
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
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          tags: data.tags,
          notes: data.notes,
          priceTableId: data.priceTableId,
          allowedPaymentMethods: data.allowedPaymentMethods,
          isActive: data.isActive !== undefined ? data.isActive : true
        }
      });
      // create credit profile automatically
      await prisma.customerCredit.create({
        data: {
          customerId: customer.id,
          companyId: req.user.companyId,
          creditLimit: 0,
          usedCredit: 0,
          internalScore: 50 // initial average score
        }
      });
      res.status(201).json({ success: true, data: customer });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async list(req: Request, res: Response) {
    try {
      // Basic filtering
      const { search, status } = req.query;
      let whereClause: any = { companyId: req.user.companyId };

      if (search) {
        whereClause.OR = [
          { name: { contains: String(search) } },
          { document: { contains: String(search) } },
          { email: { contains: String(search) } }
        ];
      }

      if (status) {
        whereClause.isActive = status === 'active';
      }

      const customers = await prisma.customer.findMany({
        where: whereClause,
        include: { credit: true },
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json({ success: true, data: customers });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
