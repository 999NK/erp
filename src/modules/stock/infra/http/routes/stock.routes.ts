import { Router } from 'express';
import { StockController } from '../../../controllers/stock.controller';
import { StockService } from '../../../services/stock.service';
import { PrismaStockRepository } from '../../../repositories/prisma/prisma-stock.repository';
import { ensureAuthenticated } from '../../../../../shared/infra/http/middlewares/ensureAuthenticated';
import { ensurePermission } from '../../../../../shared/infra/http/middlewares/ensurePermission';

const stockRoutes = Router();
const stockRepository = new PrismaStockRepository();
const stockService = new StockService(stockRepository);
const stockController = new StockController(stockService);

stockRoutes.use(ensureAuthenticated);

stockRoutes.post('/movements', ensurePermission('stock.adjust'), (req, res) => stockController.createMovement(req, res));
stockRoutes.get('/movements', ensurePermission('stock.view'), (req, res) => stockController.getMovements(req, res));
stockRoutes.get('/snapshots', ensurePermission('stock.view'), (req, res) => stockController.getSnapshots(req, res));
stockRoutes.get('/locations', ensurePermission('stock.view'), (req, res) => stockController.getLocations(req, res));

export { stockRoutes };

