import { Router } from 'express';
import { TasksController } from '../controllers/tasks.controller';
import { TasksService } from '../../../services/tasks.service';
import { PrismaTasksRepository } from '../../../repositories/prisma/prisma-tasks.repository';
import { ensureAuthenticated } from '../../../../../shared/infra/http/middlewares/ensureAuthenticated';
import { ensurePermission } from '../../../../../shared/infra/http/middlewares/ensurePermission';

const tasksRouter = Router();

const repository = new PrismaTasksRepository();
const service = new TasksService(repository);
const controller = new TasksController(service);

tasksRouter.use(ensureAuthenticated);

// Create demands (ADMIN / MANAGER)
tasksRouter.post('/', ensurePermission('demands.create'), (req, res) => controller.create(req, res));

// Everyone with demands.view can list and get
tasksRouter.get('/', ensurePermission('demands.view'), (req, res) => controller.list(req, res));
tasksRouter.get('/:id', ensurePermission('demands.view'), (req, res) => controller.get(req, res));

// Status updates, comments, checklist
tasksRouter.patch('/:id/status', ensurePermission('demands.view'), (req, res) => controller.updateStatus(req, res));
tasksRouter.post('/:id/comments', ensurePermission('demands.view'), (req, res) => controller.addComment(req, res));
tasksRouter.post('/:id/checklist', ensurePermission('demands.create'), (req, res) => controller.addChecklist(req, res));
tasksRouter.patch('/:id/checklist/:itemId', ensurePermission('demands.view'), (req, res) => controller.toggleChecklist(req, res));
tasksRouter.post('/:id/attachments', ensurePermission('demands.view'), (req, res) => controller.addAttachment(req, res));

export default tasksRouter;
