import { CreateProductDTO } from '../dto/create-product.dto';
import { ProductEntity } from '../entities/product.entity';

export class ProductMapper {
  static toDomain(raw: any): ProductEntity {
    return new ProductEntity({
      id: raw.id,
      companyId: raw.companyId,
      name: raw.name,
      sku: raw.sku,
      barcode: raw.barcode,
      price: raw.price,
      costPrice: raw.costPrice,
      margin: raw.margin,
      unit: raw.unit,
      type: raw.type,
      categoryId: raw.categoryId,
      ncm: raw.ncm,
      cest: raw.cest,
      cfop: raw.cfop,
      notes: raw.notes,
      minStock: raw.minStock,
      allowNegativeStock: raw.allowNegativeStock,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toDTO(entity: ProductEntity): any {
    return {
      id: entity.id,
      name: entity.name,
      sku: entity.sku,
      barcode: entity.barcode,
      price: entity.price,
      costPrice: entity.costPrice,
      margin: entity.margin,
      unit: entity.unit,
      type: entity.type,
      categoryId: entity.categoryId,
      ncm: entity.ncm,
      cest: entity.cest,
      cfop: entity.cfop,
      notes: entity.notes,
      minStock: entity.minStock,
      allowNegativeStock: entity.allowNegativeStock,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
