import { IStockRepository } from '../../interfaces/stock.repository.interface';
import { StockMovementEntity } from '../../entities/stock-movement.entity';
import { StockSnapshotEntity } from '../../entities/stock-snapshot.entity';
import { prisma } from '../../../../shared/infra/database/prisma';

export class PrismaStockRepository implements IStockRepository {
  async registerMovementAndSyncSnapshot(
    data: Omit<StockMovementEntity, 'id' | 'createdAt'>,
    preventNegativeStock: boolean
  ): Promise<{ movement: StockMovementEntity; snapshot: StockSnapshotEntity }> {
    return await prisma.$transaction(async (tx) => {
      // 1. Insert Movement record for audit
      const movementRaw = await tx.stockMovement.create({
        data: {
          companyId: data.companyId,
          productId: data.productId,
          locationId: data.locationId,
          userId: data.userId,
          type: data.type,
          quantity: data.quantity,
          unitCost: data.unitCost,
          reference: data.reference,
          notes: data.notes,
        },
      });

      // 2. Upsert Snapshot with atomic increment to avoid race conditions
      const snapshotRaw = await tx.stockSnapshot.upsert({
        where: {
          companyId_productId_locationId: {
            companyId: data.companyId,
            productId: data.productId,
            locationId: data.locationId,
          },
        },
        create: {
          companyId: data.companyId,
          productId: data.productId,
          locationId: data.locationId,
          quantity: data.quantity,
          lastCost: data.unitCost,
        },
        update: {
          quantity: { increment: data.quantity },
          lastCost: data.unitCost !== null && data.unitCost !== undefined ? data.unitCost : undefined,
        },
      });

      // 3. Database-level logical protection against negative stock
      if (preventNegativeStock && snapshotRaw.quantity < 0) {
        throw new Error(`Estoque insuficiente. Saldo da operação seria: ${snapshotRaw.quantity}`);
      }

      return {
        movement: new StockMovementEntity(movementRaw),
        snapshot: new StockSnapshotEntity(snapshotRaw),
      };
    });
  }

  async getSnapshots(companyId: string, filters?: { productId?: string; locationId?: string }): Promise<StockSnapshotEntity[]> {
    const snapshots = await prisma.stockSnapshot.findMany({
      where: {
        companyId,
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.locationId && { locationId: filters.locationId }),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
         product: true // Em um ERP real trariamos o DTO da relação
      }
    });
    // @ts-ignore - Temporary mapping include
    return snapshots.map((s) => ({
      ...new StockSnapshotEntity(s),
      product: s.product
    }));
  }

  async getMovements(companyId: string, filters?: { productId?: string; type?: string }): Promise<StockMovementEntity[]> {
    const movements = await prisma.stockMovement.findMany({
      where: {
        companyId,
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.type && { type: filters.type }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return movements.map((m) => new StockMovementEntity(m));
  }

  async getDefaultLocation(companyId: string): Promise<string | null> {
    let loc = await prisma.stockLocation.findFirst({
      where: { companyId, isDefault: true, isActive: true },
    });
    if (!loc) {
      loc = await prisma.stockLocation.findFirst({
        where: { companyId, isActive: true },
      });
    }
    return loc ? loc.id : null;
  }

  async getLocations(companyId: string): Promise<any[]> {
    return prisma.stockLocation.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
