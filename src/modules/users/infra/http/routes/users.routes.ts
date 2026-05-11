import { Router } from 'express';
import { UsersController } from '../../../controllers/users.controller';
import { UsersService } from '../../../services/users.service';
import { PrismaUsersRepository } from '../../../repositories/prisma/prisma-users.repository';
import { BcryptHashProvider } from '../../../../../shared/providers/HashProvider';
import { ensureAuthenticated } from '../../../../../shared/infra/http/middlewares/ensureAuthenticated';
import { ensurePermission } from '../../../../../shared/infra/http/middlewares/ensurePermission';
import { ensureMinRole } from '../../../../../shared/infra/http/middlewares/ensurePermission';

const usersRoutes = Router();
const usersRepository = new PrismaUsersRepository();
const hashProvider = new BcryptHashProvider();
const usersService = new UsersService(usersRepository, hashProvider);
const usersController = new UsersController(usersService);

usersRoutes.use(ensureAuthenticated);

// List & Create
usersRoutes.get('/', ensurePermission('users.view'), (req, res) => usersController.getAll(req, res));
usersRoutes.post('/', ensurePermission('users.create'), (req, res) => usersController.create(req, res));

// Permissions
usersRoutes.get('/:id/permissions', ensurePermission('users.manage'), (req, res) => usersController.getPermissions(req, res));
usersRoutes.patch('/:id/permissions', ensurePermission('users.manage'), (req, res) => usersController.updatePermissions(req, res));

// Status (block/unblock)
usersRoutes.patch('/:id/status', ensurePermission('users.edit'), (req, res) => usersController.updateStatus(req, res));

// Impersonate (Admin only)
usersRoutes.post('/:id/impersonate', ensureMinRole('ADMIN'), (req, res) => usersController.impersonate(req, res));

// Reset Password
usersRoutes.post('/:id/reset-password', ensurePermission('users.edit'), (req, res) => usersController.resetPassword(req, res));

export { usersRoutes };
