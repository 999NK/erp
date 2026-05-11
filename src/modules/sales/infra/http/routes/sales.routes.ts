import { Router } from 'express';
import { SalesController } from '../../../controllers/sales.controller';
import { SalesService } from '../../../services/sales.service';
import { PrismaSalesRepository } from '../../../repositories/prisma/prisma-sales.repository';
import { PrismaStockRepository } from '../../../../stock/repositories/prisma/prisma-stock.repository';
import { ensureAuthenticated } from '../../../../../shared/infra/http/middlewares/ensureAuthenticated';
import { ensurePermission } from '../../../../../shared/infra/http/middlewares/ensurePermission';

const salesRoutes = Router();
const salesRepository = new PrismaSalesRepository();
const stockRepository = new PrismaStockRepository();
const salesService = new SalesService(salesRepository, stockRepository);
const salesController = new SalesController(salesService);

salesRoutes.use(ensureAuthenticated);

// List Sales
salesRoutes.get('/', ensurePermission('sales.view'), (req, res) => salesController.listSales(req, res));

// Point of Sale routes
salesRoutes.post('/', ensurePermission('sales.create'), (req, res) => salesController.createSale(req, res));

// Cash Register routes (requires pos.access)
salesRoutes.get('/session', ensurePermission('pos.access'), (req, res) => salesController.getSession(req, res));
salesRoutes.post('/session/open', ensurePermission('pos.access'), (req, res) => salesController.openSession(req, res));
salesRoutes.post('/session/:sessionId/close', ensurePermission('pos.access'), (req, res) => salesController.closeSession(req, res));
salesRoutes.post('/session/movement', ensurePermission('pos.access'), (req, res) => salesController.registerCashMovement(req, res));

export { salesRoutes };
