import { Router } from 'express';
import { AnalyticsController } from '../../../controllers/analytics.controller';
import { ExportController } from '../../../controllers/export.controller';
import { FinancialAnalyticsService } from '../../../services/financial-analytics.service';
import { CommercialAnalyticsService } from '../../../services/commercial-analytics.service';
import { InventoryAnalyticsService } from '../../../services/inventory-analytics.service';
import { ensureAuthenticated } from '../../../../../shared/infra/http/middlewares/ensureAuthenticated';

const reportingRoutes = Router();

const financialAnalytics = new FinancialAnalyticsService();
const commercialAnalytics = new CommercialAnalyticsService();
const inventoryAnalytics = new InventoryAnalyticsService();
const analyticsController = new AnalyticsController(financialAnalytics, commercialAnalytics, inventoryAnalytics);
const exportController = new ExportController();

// Public download route (with inline token check if necessary, for now relying on hard-to-guess UUID)
reportingRoutes.get('/download/:storageKey', (req, res) => exportController.downloadReport(req, res));

reportingRoutes.use(ensureAuthenticated);

reportingRoutes.get('/dashboard', (req, res) => analyticsController.getExecutiveDashboard(req, res));
reportingRoutes.get('/financial', (req, res) => analyticsController.getFinancialAnalytics(req, res));
reportingRoutes.get('/commercial', (req, res) => analyticsController.getCommercialAnalytics(req, res));

reportingRoutes.post('/exports', (req, res) => exportController.requestExport(req, res));
reportingRoutes.get('/exports', (req, res) => exportController.listExports(req, res));

export { reportingRoutes };
