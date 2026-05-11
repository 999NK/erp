import jwt from 'jsonwebtoken';

export interface ITokenProvider {
  generateToken(payload: any, secret: string, expiresIn: string | number): string;
  verifyToken(token: string, secret: string): any;
}

export class JwtTokenProvider implements ITokenProvider {
  generateToken(payload: any, secret: string, expiresIn: string | number): string {
    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
  }

  verifyToken(token: string, secret: string): any {
    return jwt.verify(token, secret);
  }
}
