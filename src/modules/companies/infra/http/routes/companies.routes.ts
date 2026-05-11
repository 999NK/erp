import { Router } from 'express';
import { CompaniesController } from '../../../controllers/companies.controller';
import { CompaniesService } from '../../../services/companies.service';
import { PrismaCompaniesRepository } from '../../../repositories/prisma/prisma-companies.repository';

const companiesRoutes = Router();
const companiesRepository = new PrismaCompaniesRepository();
const companiesService = new CompaniesService(companiesRepository);
const companiesController = new CompaniesController(companiesService);

companiesRoutes.post('/', (req, res) => companiesController.create(req, res));

export { companiesRoutes };
