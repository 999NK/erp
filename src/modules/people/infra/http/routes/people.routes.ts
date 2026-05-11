import { Router } from 'express';
import { CustomerController } from '../../../controllers/customer.controller';
import { SupplierController } from '../../../controllers/supplier.controller';
import { ensureAuthenticated } from '../../../../../shared/infra/http/middlewares/ensureAuthenticated';

const peopleRoutes = Router();
const customerController = new CustomerController();
const supplierController = new SupplierController();

peopleRoutes.use(ensureAuthenticated);

peopleRoutes.post('/customers', (req, res) => customerController.create(req, res));
peopleRoutes.get('/customers', (req, res) => customerController.list(req, res));

peopleRoutes.post('/suppliers', (req, res) => supplierController.create(req, res));
peopleRoutes.get('/suppliers', (req, res) => supplierController.list(req, res));

export { peopleRoutes };
