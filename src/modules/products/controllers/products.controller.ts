import { Request, Response } from 'express';
import { ProductsService } from '../services/products.service';
import { CreateProductValidator } from '../validators/create-product.validator';
import { ProductMapper } from '../mappers/product.mapper';

export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user.companyId;
      const validatedData = CreateProductValidator.validate({ ...req.body, companyId });
      const product = await this.productsService.createProduct(validatedData);
      res.status(201).json({ success: true, data: ProductMapper.toDTO(product) });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async index(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user.companyId;
      const { search, page, limit } = req.query;

      const products = await this.productsService.getAllProducts(companyId, {
        search: search ? String(search) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({ success: true, data: products.map(ProductMapper.toDTO) });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;
      const product = await this.productsService.getProductById(id, companyId);
      res.status(200).json({ success: true, data: ProductMapper.toDTO(product) });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ success: false, message: 'Produto não encontrado' });
        return;
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.id;
      const { id } = req.params;
      
      const updatedProduct = await this.productsService.updateProduct(id, companyId, req.body, userId);
      res.status(200).json({ success: true, data: ProductMapper.toDTO(updatedProduct) });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getPriceHistory(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;
      const history = await this.productsService.getPriceHistory(id, companyId);
      res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

