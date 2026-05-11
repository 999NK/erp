import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const authData = await this.authService.authenticate(req.body);
      res.status(200).json({ success: true, data: authData });
    } catch (error: any) {
      // Sempre retornamos um 401 ambíguo para questões de segurança (não listar se o usuário/empresa não existe)
      res.status(401).json({ success: false, message: 'Invalid credentials or unauthorized tenant.' });
    }
  }
}
