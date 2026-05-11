import { Request, Response } from 'express';
import { UsersService } from '../services/users.service';

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const reqDto = {
        ...req.body,
        companyId: req.user.companyId,
        creatorRole: req.user.role
      };
      const user = await this.usersService.createUser(reqDto);
      const { passwordHash, ...safeUser } = user;
      res.status(201).json({ success: true, data: safeUser });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.usersService.getUsers(req.user.companyId);
      const safeUsers = users.map(user => {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
      });
      res.status(200).json({ success: true, data: safeUsers });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getPermissions(req: Request, res: Response): Promise<void> {
    try {
      const permissions = await this.usersService.getPermissions(req.params.id, req.user.companyId);
      res.status(200).json({ success: true, data: permissions });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updatePermissions(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.usersService.updatePermissions(
        req.params.id,
        req.user.companyId,
        req.body.permissions,
        req.user.role
      );
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async impersonate(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.usersService.impersonate(req.params.id, req.user);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(403).json({ success: false, message: error.message });
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const updatedUser = await this.usersService.updateStatus(req.params.id, req.user.companyId, req.body.isActive);
      res.status(200).json({ success: true, data: updatedUser });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.usersService.resetPassword(req.params.id, req.user.companyId, req.body.newPassword);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
