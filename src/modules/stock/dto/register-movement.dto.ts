export interface RegisterMovementDTO {
  companyId: string;
  userId: string;
  productId: string;
  locationId?: string; // If null, service finds the default
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity?: number; // Optional if realQuantity is provided during adjustment
  realQuantity?: number; // Only for ADJUSTMENT
  unitCost?: number;
  reference?: string;
  notes?: string;
  preventNegative?: boolean; // Default true
}
