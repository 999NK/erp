import bcrypt from 'bcryptjs';

export interface IHashProvider {
  generateHash(payload: string): Promise<string>;
  compareHash(payload: string, hashed: string): Promise<boolean>;
}

export class BcryptHashProvider implements IHashProvider {
  async generateHash(payload: string): Promise<string> {
    return bcrypt.hash(payload, 8);
  }

  async compareHash(payload: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(payload, hashed);
  }
}
