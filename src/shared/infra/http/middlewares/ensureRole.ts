import { Request, Response, NextFunction } from 'express';

export function ensureRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { role } = req.user;

    if (!role) {
      return res.status(403).json({ message: 'Role not found' });
    }

    if (!roles.includes(role)) {
      return res.status(403).json({ message: 'Insufficient role permissions' });
    }

    return next();
  };
}
