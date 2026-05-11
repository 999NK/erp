import { CreateProductDTO } from './create-product.dto';

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  isActive?: boolean;
  reason?: string;
  percentageApplied?: number;
}
