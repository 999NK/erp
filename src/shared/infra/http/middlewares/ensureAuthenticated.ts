import { Request, Response, NextFunction } from 'express';
import { JwtTokenProvider } from '../../../providers/TokenProvider';

interface TokenPayload {
  sub: string;
  companyId: string;
  role: string;
}

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token is missing' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const tokenProvider = new JwtTokenProvider();
    const jwtSecret = process.env.JWT_SECRET || 'default_secret';
    
    const decoded = tokenProvider.verifyToken(token, jwtSecret);
    const { sub, companyId, role } = decoded as TokenPayload;

    req.user = { id: sub, companyId, role };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
