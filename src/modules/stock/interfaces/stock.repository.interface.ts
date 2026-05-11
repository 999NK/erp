import { StockMovementEntity } from '../entities/stock-movement.entity';
import { StockSnapshotEntity } from '../entities/stock-snapshot.entity';

export interface IStockRepository {
  registerMovementAndSyncSnapshot(
    movement: Omit<StockMovementEntity, "id" | "createdAt">, 
    preventNegativeStock: boolean
  ): Promise<{ movement: StockMovementEntity, snapshot: StockSnapshotEntity }>;
  
  getSnapshots(companyId: string, filters?: { productId?: string; locationId?: string }): Promise<StockSnapshotEntity[]>;
  getMovements(companyId: string, filters?: { productId?: string; type?: string }): Promise<StockMovementEntity[]>;
  getDefaultLocation(companyId: string): Promise<string | null>;
  getLocations(companyId: string): Promise<any[]>;
}

