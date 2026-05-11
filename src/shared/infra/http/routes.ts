import { Router } from 'express';
import { authRoutes } from '../../../modules/auth/infra/http/routes/auth.routes';
import { companiesRoutes } from '../../../modules/companies/infra/http/routes/companies.routes';
import { usersRoutes } from '../../../modules/users/infra/http/routes/users.routes';
import { productsRoutes } from '../../../modules/products/infra/http/routes/products.routes';
import { stockRoutes } from '../../../modules/stock/infra/http/routes/stock.routes';
import { salesRoutes } from '../../../modules/sales/infra/http/routes/sales.routes';
import { financialRoutes } from '../../../modules/financial/infra/http/routes/financial.routes';
import { peopleRoutes } from '../../../modules/people/infra/http/routes/people.routes';
import { reportingRoutes } from '../../../modules/reporting/infra/http/routes/reporting.routes';
import { intelligenceRoutes } from '../../../modules/intelligence/infra/http/routes/intelligence.routes';

import tasksRoutes from '../../../modules/tasks/infra/http/routes/tasks.routes';

const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/companies', companiesRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/products', productsRoutes);
apiRouter.use('/stock', stockRoutes);
apiRouter.use('/sales', salesRoutes);
apiRouter.use('/financial', financialRoutes);
apiRouter.use('/people', peopleRoutes);
apiRouter.use('/reporting', reportingRoutes);
apiRouter.use('/intelligence', intelligenceRoutes);
apiRouter.use('/demands', tasksRoutes);

export { apiRouter };
