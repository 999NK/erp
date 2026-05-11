import { IStockRepository } from '../interfaces/stock.repository.interface';
import { RegisterMovementDTO } from '../dto/register-movement.dto';
import { StockMovementEntity } from '../entities/stock-movement.entity';
import { StockSnapshotEntity } from '../entities/stock-snapshot.entity';

export class StockService {
  constructor(private readonly stockRepository: IStockRepository) {}

  async registerMovement(data: RegisterMovementDTO): Promise<{ movement: StockMovementEntity, snapshot: StockSnapshotEntity }> {
    let finalLocationId = data.locationId;
    if (!finalLocationId) {
       finalLocationId = await this.stockRepository.getDefaultLocation(data.companyId) || '';
       if (!finalLocationId) {
          throw new Error('No default location found. Please specify a location or configure a default.');
       }
    }

    let computedQuantity = 0;

    if (data.type === 'ADJUSTMENT' && data.realQuantity !== undefined) {
      if (data.realQuantity < 0) {
        throw new Error('Real quantity cannot be negative for adjustments.');
      }
      if (!data.notes) {
        throw new Error('Notes/Reason is mandatory for adjustments.');
      }
      
      const snapshots = await this.stockRepository.getSnapshots(data.companyId, { productId: data.productId, locationId: finalLocationId });
      const currentQuantity = snapshots.length > 0 ? snapshots[0].quantity : 0;
      
      computedQuantity = data.realQuantity - currentQuantity;
      
      // If no difference, do not proceed
      if (computedQuantity === 0) {
         throw new Error('Real quantity is equal to current stock. No adjustment needed.');
      }
    } else {
      if (data.quantity === undefined || data.quantity <= 0) {
        throw new Error('Quantity must be greater than zero. Type dictates direction.');
      }
      
      if (data.type === 'OUT') {
        computedQuantity = -Math.abs(data.quantity);
      } else if (data.type === 'IN') {
        computedQuantity = Math.abs(data.quantity);
      } else {
        computedQuantity = data.quantity;
      }
    }

    const preventNegative = data.preventNegative !== undefined ? data.preventNegative : true;

    return this.stockRepository.registerMovementAndSyncSnapshot({
      companyId: data.companyId,
      userId: data.userId,
      productId: data.productId,
      locationId: finalLocationId,
      type: data.type,
      quantity: computedQuantity,
      unitCost: data.unitCost,
      reference: data.reference,
      notes: data.notes,
    }, preventNegative);
  }

  async getInventorySnapshots(companyId: string, filters?: { productId?: string, locationId?: string }) {
    return this.stockRepository.getSnapshots(companyId, filters);
  }

  async getMovementsHistory(companyId: string, filters?: { productId?: string, type?: string }) {
    return this.stockRepository.getMovements(companyId, filters);
  }

  async getLocations(companyId: string) {
    return this.stockRepository.getLocations(companyId);
  }
}
