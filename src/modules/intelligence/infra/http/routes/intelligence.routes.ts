import { Router } from 'express';
import { ForecastController } from '../../../controllers/forecast.controller';
import { AnomalyController } from '../../../controllers/anomaly.controller';
import { ForecastService } from '../../../services/forecast.service';
import { AnomalyService } from '../../../services/anomaly.service';
import { ensureAuthenticated } from '../../../../../shared/infra/http/middlewares/ensureAuthenticated';

const intelligenceRoutes = Router();

const forecastService = new ForecastService();
const forecastController = new ForecastController(forecastService);

const anomalyService = new AnomalyService();
const anomalyController = new AnomalyController(anomalyService);

intelligenceRoutes.use(ensureAuthenticated);

intelligenceRoutes.get('/forecasts', (req, res) => forecastController.getForecasts(req, res));
intelligenceRoutes.get('/anomalies', (req, res) => anomalyController.getAlerts(req, res));
intelligenceRoutes.post('/anomalies/detect', (req, res) => anomalyController.detectAnomalies(req, res));

export { intelligenceRoutes };
