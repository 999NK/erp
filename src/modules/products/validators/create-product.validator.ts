import { CreateProductDTO } from '../dto/create-product.dto';

export class CreateProductValidator {
  static validate(data: any): CreateProductDTO {
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Name is required and must be a string.');
    }
    if (data.price === undefined || typeof data.price !== 'number' || data.price < 0) {
      throw new Error('Price is required and must be a positive number.');
    }
    
    return {
      companyId: data.companyId,
      name: data.name,
      sku: data.sku,
      barcode: data.barcode,
      price: data.price,
      costPrice: data.costPrice !== undefined ? Number(data.costPrice) : undefined,
      margin: data.margin !== undefined ? Number(data.margin) : undefined,
      unit: data.unit,
      type: data.type,
      categoryId: data.categoryId,
      ncm: data.ncm,
      cest: data.cest,
      cfop: data.cfop,
      notes: data.notes,
      minStock: data.minStock !== undefined ? Number(data.minStock) : undefined,
      allowNegativeStock: data.allowNegativeStock === true || data.allowNegativeStock === 'true',
    };
  }
}
