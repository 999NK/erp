export interface CreateProductDTO {
  companyId: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  costPrice?: number;
  margin?: number;
  unit?: string;
  type?: string;
  categoryId?: string;
  ncm?: string;
  cest?: string;
  cfop?: string;
  notes?: string;
  minStock?: number;
  allowNegativeStock?: boolean;
}
