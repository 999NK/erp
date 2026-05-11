import { PrismaClient } from '@prisma/client';
import { IAccountPayableRepository } from '../../interfaces/payable.repository.interface';
import { CreateAccountPayableDTO, PayPayableDTO } from '../../dto/payable.dto';

const prisma = new PrismaClient();

export class PrismaPayableRepository implements IAccountPayableRepository {
  async create(data: CreateAccountPayableDTO) {
    return await prisma.accountPayable.create({
      data: {
        companyId: data.companyId,
        supplierId: data.supplierId,
        description: data.description,
        categoryId: data.categoryId,
        costCenterId: data.costCenterId,
        accountId: data.accountId,
        amount: Number(data.amount),
        dueDate: new Date(data.dueDate),
        accrualDate: data.accrualDate ? new Date(data.accrualDate) : undefined,
        issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
        interestAmount: data.interestAmount ? Number(data.interestAmount) : undefined,
        penaltyAmount: data.penaltyAmount ? Number(data.penaltyAmount) : undefined,
        discountAmount: data.discountAmount ? Number(data.discountAmount) : undefined,
        notes: data.notes,
        reference: data.reference,
        status: 'OPEN'
      }
    });
  }

  async findById(id: string, companyId: string) {
    return await prisma.accountPayable.findFirst({
      where: { id, companyId },
      include: {
        supplier: true,
        allocations: { include: { transaction: true } }
      }
    });
  }

  async list(companyId: string, filters?: any) {
    return await prisma.accountPayable.findMany({
      where: { companyId, ...filters },
      include: { supplier: true },
      orderBy: { dueDate: 'asc' }
    });
  }

  async pay(data: PayPayableDTO) {
    // Perform ACID transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Lock/fetch the payable
      const payable = await tx.accountPayable.findFirst({
        where: { id: data.payableId, companyId: data.companyId }
      });

      if (!payable) throw new Error('Payable not found');
      if (payable.status === 'PAID' || payable.status === 'CANCELED') {
         throw new Error('Payable is already paid or canceled');
      }

      const amountPaid = Number(data.amount);
      const discount = Number(data.discountAmount || 0);
      const interest = Number(data.interestAmount || 0);
      const penalty = Number(data.penaltyAmount || 0);

      const newPaidAmount = payable.paidAmount + amountPaid;
      let newStatus = payable.status;
      
      // Determine if it fully pays the AP (amountPaid is base amount)
      if (newPaidAmount >= payable.amount) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIAL';
      }

      // Compute total flow
      const totalCashFlow = amountPaid - discount + interest + penalty;

      // 2. Create Transaction (Ledger entry)
      const transaction = await tx.financialTransaction.create({
        data: {
          companyId: data.companyId,
          accountId: data.accountId,
          userId: data.userId,
          type: 'EXPENSE',
          amount: -totalCashFlow, // Always negative for EXPENSE flow
          categoryId: payable.categoryId, // inherit category
          costCenterId: payable.costCenterId,
          payableId: payable.id,
          description: `Payment for: ${payable.description}`,
          reference: `PAY:${payable.id}`,
        }
      });

      // 3. Create Allocation (to link the exact math)
      await tx.paymentAllocation.create({
        data: {
          companyId: data.companyId,
          transactionId: transaction.id,
          payableId: payable.id,
          amount: amountPaid,
          discountAmount: discount,
          interestAmount: interest,
          penaltyAmount: penalty,
        }
      });

      // 4. Update the account balance
      await tx.financialAccount.update({
        where: { id: data.accountId },
        data: { balance: { decrement: totalCashFlow } }
      });

      // 5. Update the Payable
      return await tx.accountPayable.update({
        where: { id: payable.id },
        data: {
          paidAmount: newPaidAmount,
          discountAmount: { increment: discount },
          interestAmount: { increment: interest },
          penaltyAmount: { increment: penalty },
          status: newStatus,
          paidDate: newStatus === 'PAID' ? new Date() : payable.paidDate
        }
      });
    });
  }
}
