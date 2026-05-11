import { RefreshTokenEntity } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository {
  save(token: RefreshTokenEntity): Promise<RefreshTokenEntity>;
  findValidToken(token: string): Promise<RefreshTokenEntity | null>;
  revoke(tokenId: string): Promise<void>;
}
