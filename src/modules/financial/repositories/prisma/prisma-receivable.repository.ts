import { PrismaClient } from '@prisma/client';
import { IAccountReceivableRepository } from '../../interfaces/receivable.repository.interface';
import { CreateAccountReceivableDTO, ReceivePaymentDTO } from '../../dto/receivable.dto';

const prisma = new PrismaClient();

export class PrismaReceivableRepository implements IAccountReceivableRepository {
  async create(data: CreateAccountReceivableDTO) {
    return await prisma.accountReceivable.create({
      data: {
        companyId: data.companyId,
        customerId: data.customerId,
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
    return await prisma.accountReceivable.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        allocations: { include: { transaction: true } }
      }
    });
  }

  async list(companyId: string, filters?: any) {
    return await prisma.accountReceivable.findMany({
      where: { companyId, ...filters },
      include: { customer: true },
      orderBy: { dueDate: 'asc' }
    });
  }

  async receive(data: ReceivePaymentDTO) {
    // Perform ACID transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Lock/fetch the receivable
      const receivable = await tx.accountReceivable.findFirst({
        where: { id: data.receivableId, companyId: data.companyId }
      });

      if (!receivable) throw new Error('Receivable not found');
      if (receivable.status === 'RECEIVED' || receivable.status === 'CANCELED') {
         throw new Error('Receivable is already received or canceled');
      }

      const amountToReceive = Number(data.amount);
      const discount = Number(data.discountAmount || 0);
      const interest = Number(data.interestAmount || 0);
      const penalty = Number(data.penaltyAmount || 0);

      const newReceivedAmount = receivable.receivedAmount + amountToReceive;
      let newStatus = receivable.status;
      
      // Determine if it fully pays the AR (amount is base amount)
      if (newReceivedAmount >= receivable.amount) {
        newStatus = 'RECEIVED';
      } else if (newReceivedAmount > 0) {
        newStatus = 'PARTIAL';
      }

      // Compute total flow
      const totalCashFlow = amountToReceive - discount + interest + penalty;

      // 2. Create Transaction (Ledger entry)
      const transaction = await tx.financialTransaction.create({
        data: {
          companyId: data.companyId,
          accountId: data.accountId,
          userId: data.userId,
          type: 'INCOME',
          amount: totalCashFlow, // Always positive for INCOME flow
          categoryId: receivable.categoryId, // inherit category
          costCenterId: receivable.costCenterId,
          receivableId: receivable.id,
          description: `Receipt for: ${receivable.description}`,
          reference: `RECV:${receivable.id}`,
        }
      });

      // 3. Create Allocation (to link the exact math)
      await tx.paymentAllocation.create({
        data: {
          companyId: data.companyId,
          transactionId: transaction.id,
          receivableId: receivable.id,
          amount: amountToReceive,
          discountAmount: discount,
          interestAmount: interest,
          penaltyAmount: penalty,
        }
      });

      // 4. Update the account balance
      await tx.financialAccount.update({
        where: { id: data.accountId },
        data: { balance: { increment: totalCashFlow } }
      });

      // 5. Update the Receivable
      return await tx.accountReceivable.update({
        where: { id: receivable.id },
        data: {
          receivedAmount: newReceivedAmount,
          discountAmount: { increment: discount },
          interestAmount: { increment: interest },
          penaltyAmount: { increment: penalty },
          status: newStatus,
          receivedDate: newStatus === 'RECEIVED' ? new Date() : receivable.receivedDate
        }
      });
    });
  }
}
