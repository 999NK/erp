import { ISalesRepository } from '../interfaces/sales.repository.interface';
import { RegisterSaleDTO } from '../dto/register-sale.dto';
import { RegisterCashMovementDTO } from '../dto/register-cash-movement.dto';
import { SaleEntity } from '../entities/sale.entity';
import { CashRegisterSessionEntity } from '../entities/cash-register-session.entity';
import { IStockRepository } from '../../stock/interfaces/stock.repository.interface';
import { prisma } from '../../../shared/infra/database/prisma';

export class SalesService {
  constructor(
    private readonly salesRepository: ISalesRepository,
    private readonly stockRepository: IStockRepository
  ) {}

  async processSale(data: RegisterSaleDTO): Promise<SaleEntity> {
    const session = await this.salesRepository.findSessionById(data.sessionId, data.companyId);
    if (!session || session.status !== 'OPEN') {
      throw new Error('You must have an open cash register session to complete a sale.');
    }

    // Default location retrieval logic since sales need to withdraw stock
    const defaultLocation = await this.stockRepository.getDefaultLocation(data.companyId);
    if (!defaultLocation) {
        throw new Error('Company has no active default stock location.');
    }

    return await this.salesRepository.registerSaleTransaction(data, defaultLocation);
  }

  async openSession(companyId: string, userId: string, initialBalance: number): Promise<CashRegisterSessionEntity> {
    const existingSession = await this.salesRepository.getActiveSession(companyId, userId);
    if (existingSession) throw new Error('User already has an open session.');

    return await this.salesRepository.openSession(companyId, userId, initialBalance);
  }

  async closeSession(companyId: string, userId: string, sessionId: string, finalBalance: number): Promise<CashRegisterSessionEntity> {
    const session = await this.salesRepository.findSessionById(sessionId, companyId);
    if (!session) throw new Error('Session not found.');
    if (session.userId !== userId) throw new Error('Cannot close a session belonging to another user.');
    if (session.status !== 'OPEN') throw new Error('Session is already closed.');
    
    return await this.salesRepository.closeSession(sessionId, companyId, finalBalance);
  }

  async getSession(companyId: string, userId: string): Promise<CashRegisterSessionEntity | null> {
    return await this.salesRepository.getActiveSession(companyId, userId);
  }

  async getSales(companyId: string, page: number, limit: number, filters: any) {
    // We will bypass repository for simplicity of query builder
    const skip = (page - 1) * limit;
    
    let where: any = { companyId };
    
    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, document: true } },
          user: { select: { id: true, name: true } },
          items: {
            include: { product: { select: { name: true, sku: true } } }
          },
          payments: true
        }
      }),
      prisma.sale.count({ where })
    ]);

    return {
      data: sales,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Not in interface to simplify, we can use prisma directly here or expand later
  async registerCashMovement(data: RegisterCashMovementDTO) {
    const session = await this.salesRepository.findSessionById(data.sessionId, data.companyId);
    if (!session || session.status !== 'OPEN') {
      throw new Error('Valid open session required for cash movement.');
    }

    await prisma.cashMovement.create({
        data: {
            sessionId: data.sessionId,
            type: data.type,
            amount: data.amount,
            description: data.description
        }
    });
  }
}
