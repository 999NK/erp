import { Router } from 'express';
import { ProductsController } from '../../../controllers/products.controller';
import { ProductsService } from '../../../services/products.service';
import { PrismaProductsRepository } from '../../../repositories/prisma/prisma-products.repository';
import { ProductTypesController } from '../../../controllers/product-types.controller';
import { ProductTypesService } from '../../../services/product-types.service';
import { ensureAuthenticated } from '../../../../../shared/infra/http/middlewares/ensureAuthenticated';
import { ensurePermission } from '../../../../../shared/infra/http/middlewares/ensurePermission';

const productsRoutes = Router();
const productsRepository = new PrismaProductsRepository();
const productsService = new ProductsService(productsRepository);
const productsController = new ProductsController(productsService);

const productTypesService = new ProductTypesService();
const productTypesController = new ProductTypesController(productTypesService);

// All routes here should be protected since products belong to a company
productsRoutes.use(ensureAuthenticated);

// Product Types - must go before /:id routes so /types isn't caught
productsRoutes.post('/types', (req, res) => productTypesController.create(req, res));
productsRoutes.get('/types', (req, res) => productTypesController.findAll(req, res));
productsRoutes.put('/types/:id', (req, res) => productTypesController.update(req, res));
productsRoutes.delete('/types/:id', (req, res) => productTypesController.delete(req, res));

productsRoutes.post('/', ensurePermission('products.create'), (req, res) => productsController.create(req, res));
productsRoutes.get('/', ensurePermission('products.view'), (req, res) => productsController.index(req, res));
productsRoutes.get('/:id', ensurePermission('products.view'), (req, res) => productsController.getById(req, res));
productsRoutes.get('/:id/price-history', ensurePermission('products.view'), (req, res) => productsController.getPriceHistory(req, res));
productsRoutes.patch('/:id', ensurePermission('products.edit'), (req, res) => productsController.update(req, res));
productsRoutes.put('/:id', ensurePermission('products.edit'), (req, res) => productsController.update(req, res));

export { productsRoutes };
