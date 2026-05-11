import { Router } from 'express';
import { FinancialController } from '../../../controllers/financial.controller';
import { FinancialService } from '../../../services/financial.service';
import { PrismaFinancialRepository } from '../../../repositories/prisma/prisma-financial.repository';

import { AccountPayablesController } from '../../../controllers/payable.controller';
import { AccountPayablesService } from '../../../services/payable.service';
import { PrismaPayableRepository } from '../../../repositories/prisma/prisma-payable.repository';

import { AccountReceivablesController } from '../../../controllers/receivable.controller';
import { AccountReceivablesService } from '../../../services/receivable.service';
import { PrismaReceivableRepository } from '../../../repositories/prisma/prisma-receivable.repository';

import { ensureAuthenticated } from '../../../../../shared/infra/http/middlewares/ensureAuthenticated';
import { ensurePermission } from '../../../../../shared/infra/http/middlewares/ensurePermission';

const financialRoutes = Router();

// Ledger/Transactions setup
const repository = new PrismaFinancialRepository();
const service = new FinancialService(repository);
const controller = new FinancialController(service);

// Payables setup
const payableRepository = new PrismaPayableRepository();
const payableService = new AccountPayablesService(payableRepository);
const payableController = new AccountPayablesController(payableService);

// Receivables setup
const receivableRepository = new PrismaReceivableRepository();
const receivableService = new AccountReceivablesService(receivableRepository);
const receivableController = new AccountReceivablesController(receivableService);

financialRoutes.use(ensureAuthenticated);

// Ledger Routes
financialRoutes.get('/transactions', ensurePermission('financial.view'), (req, res) => controller.getTransactions(req, res));
financialRoutes.post('/transactions', ensurePermission('financial.create'), (req, res) => controller.createTransaction(req, res));
financialRoutes.get('/accounts', ensurePermission('financial.view'), (req, res) => controller.getAccounts(req, res));
financialRoutes.get('/categories', ensurePermission('financial.view'), (req, res) => controller.getCategories(req, res));
financialRoutes.get('/cost-centers', ensurePermission('financial.view'), (req, res) => controller.getCostCenters(req, res));
financialRoutes.get('/dashboard/summary', ensurePermission('financial.view'), (req, res) => controller.getDashboardSummary(req, res));

// Payables Routes
financialRoutes.post('/payables', ensurePermission('financial.create'), (req, res) => payableController.create(req, res));
financialRoutes.get('/payables', ensurePermission('financial.view'), (req, res) => payableController.list(req, res));
financialRoutes.get('/payables/:id', ensurePermission('financial.view'), (req, res) => payableController.findById(req, res));
financialRoutes.post('/payables/:id/pay', ensurePermission('financial.edit'), (req, res) => payableController.pay(req, res));

// Receivables Routes
financialRoutes.post('/receivables', ensurePermission('financial.create'), (req, res) => receivableController.create(req, res));
financialRoutes.get('/receivables', ensurePermission('financial.view'), (req, res) => receivableController.list(req, res));
financialRoutes.get('/receivables/:id', ensurePermission('financial.view'), (req, res) => receivableController.findById(req, res));
financialRoutes.post('/receivables/:id/receive', ensurePermission('financial.edit'), (req, res) => receivableController.receive(req, res));

export { financialRoutes };
