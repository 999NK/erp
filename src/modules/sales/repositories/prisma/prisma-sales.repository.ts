import { ISalesRepository } from '../../interfaces/sales.repository.interface';
import { RegisterSaleDTO } from '../../dto/register-sale.dto';
import { SaleEntity } from '../../entities/sale.entity';
import { CashRegisterSessionEntity } from '../../entities/cash-register-session.entity';
import { prisma } from '../../../../shared/infra/database/prisma';

export class PrismaSalesRepository implements ISalesRepository {
  async registerSaleTransaction(data: RegisterSaleDTO, stockLocationId: string): Promise<SaleEntity> {
    return await prisma.$transaction(async (tx) => {
      // 1. Calc totals and validate products
      let totalAmount = 0;
      let discountAmount = 0;

      const itemsData = [];
      const stockUpdates = [];

      for (const item of data.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.companyId !== data.companyId) {
          throw new Error(`Product ${item.productId} not found or doesn't belong to company`);
        }

        const discount = item.discount || 0;
        const netPrice = item.unitPrice - discount;
        const total = netPrice * item.quantity;
        
        totalAmount += (item.unitPrice * item.quantity);
        discountAmount += (discount * item.quantity);

        itemsData.push({
          productId: product.id,
          productNameSnapshot: product.name,
          skuSnapshot: product.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: discount,
          netPrice: netPrice,
          total: total,
        });

        stockUpdates.push({
          productId: product.id,
          quantity: item.quantity,
          unitCost: product.costPrice || 0, // Using real cost price
        });
      }

      const netAmount = totalAmount - discountAmount;

      // Validate payments
      const totalPayments = data.payments.reduce((acc, p) => acc + p.amount, 0);
      if (Math.abs(totalPayments - netAmount) > 0.01) {
        throw new Error(`Payments total (${totalPayments}) does not match net amount (${netAmount})`);
      }

      // 2. Create Sale
      const sale = await tx.sale.create({
        data: {
          companyId: data.companyId,
          userId: data.userId,
          sessionId: data.sessionId,
          totalAmount,
          discountAmount,
          netAmount,
          status: 'COMPLETED',
          items: {
            create: itemsData
          },
          payments: {
            create: data.payments
          }
        },
        include: { items: true, payments: true }
      });

      // 3. Update Inventory Snapshot and Log Stock Movement
      for (const stock of stockUpdates) {
        await tx.stockMovement.create({
          data: {
            companyId: data.companyId,
            productId: stock.productId,
            locationId: stockLocationId,
            userId: data.userId,
            type: 'OUT',
            quantity: -stock.quantity,
            unitCost: stock.unitCost,
            reference: `SALE:${sale.id}`,
            notes: 'Automated sale stock outbound'
          }
        });

        const snapshotRaw = await tx.stockSnapshot.upsert({
          where: {
            companyId_productId_locationId: {
              companyId: data.companyId,
              productId: stock.productId,
              locationId: stockLocationId,
            },
          },
          create: {
            companyId: data.companyId,
            productId: stock.productId,
            locationId: stockLocationId,
            quantity: -stock.quantity,
            lastCost: stock.unitCost,
          },
          update: {
            quantity: { decrement: stock.quantity },
          },
        });

        // 4. Protect against negative stock (can be configurable per company)
        if (snapshotRaw.quantity < 0) {
          throw new Error(`Insufficient stock for Product ID ${stock.productId}. Remaining: ${snapshotRaw.quantity + stock.quantity}`);
        }
      }

      // 5. Create Cash Movement for CASH payments
      const cashAccount = await tx.financialAccount.findFirst({
         where: { companyId: data.companyId, type: 'CASH', isActive: true }
      });
      const incomeCategory = await tx.financialCategory.findFirst({
         where: { companyId: data.companyId, type: 'INCOME', name: 'Vendas' }
      });

      for (const pay of data.payments) {
        if (pay.method === 'CASH') {
          await tx.cashMovement.create({
             data: {
                sessionId: data.sessionId,
                type: 'SALE',
                amount: pay.amount,
                saleId: sale.id,
                description: `Payment for Sale ${sale.id}`
             }
          });
        }
        
        // Ledger entry for ALL payments of this sale
        if (cashAccount) {
            await tx.financialTransaction.create({
                data: {
                    companyId: data.companyId,
                    accountId: cashAccount.id,
                    userId: data.userId,
                    type: 'INCOME',
                    amount: pay.amount,
                    categoryId: incomeCategory?.id,
                    description: `Sale ${sale.id} payment via ${pay.method}`,
                    reference: `SALE:${sale.id}`
                }
            });
            await tx.financialAccount.update({
                where: { id: cashAccount.id },
                data: { balance: { increment: pay.amount } }
            });
        }
      }

      return new SaleEntity(sale);
    });
  }

  async findSessionById(sessionId: string, companyId: string): Promise<CashRegisterSessionEntity | null> {
    const session = await prisma.cashRegisterSession.findUnique({
      where: { id: sessionId, companyId }
    });
    return session ? new CashRegisterSessionEntity(session) : null;
  }

  async openSession(companyId: string, userId: string, initialBalance: number): Promise<CashRegisterSessionEntity> {
    const session = await prisma.cashRegisterSession.create({
      data: {
        companyId,
        userId,
        initialBalance,
        status: 'OPEN'
      }
    });

    if (initialBalance > 0) {
      await prisma.cashMovement.create({
         data: {
            sessionId: session.id,
            type: 'SUPPLY',
            amount: initialBalance,
            description: 'Abertura de caixa'
         }
      });
    }

    return new CashRegisterSessionEntity(session);
  }

  async closeSession(sessionId: string, companyId: string, finalBalance: number): Promise<CashRegisterSessionEntity> {
    const sessionRef = await prisma.cashRegisterSession.findUnique({ where: { id: sessionId, companyId } });
    if (!sessionRef) throw new Error('Session not found');

    const session = await prisma.cashRegisterSession.update({
      where: { id: sessionId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        finalBalance
      }
    });
    return new CashRegisterSessionEntity(session);
  }

  async getActiveSession(companyId: string, userId: string): Promise<CashRegisterSessionEntity | null> {
    const session = await prisma.cashRegisterSession.findFirst({
        where: { companyId, userId, status: 'OPEN' },
        orderBy: { openedAt: 'desc' }
    });
    return session ? new CashRegisterSessionEntity(session) : null;
  }
}
