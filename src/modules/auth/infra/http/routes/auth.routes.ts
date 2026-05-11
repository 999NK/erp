import { Router } from 'express';
import { AuthController } from '../../../controllers/auth.controller';
import { AuthService } from '../../../services/auth.service';
import { PrismaUsersRepository } from '../../../../users/repositories/prisma/prisma-users.repository';
import { BcryptHashProvider } from '../../../../../shared/providers/HashProvider';
import { JwtTokenProvider } from '../../../../../shared/providers/TokenProvider';

const authRoutes = Router();
const usersRepository = new PrismaUsersRepository();
const hashProvider = new BcryptHashProvider();
const tokenProvider = new JwtTokenProvider();

const authService = new AuthService(usersRepository, hashProvider, tokenProvider);
const authController = new AuthController(authService);

authRoutes.post('/login', (req, res) => authController.login(req, res));

export { authRoutes };
