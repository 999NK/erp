import { BaseEntity } from '../../../shared/domain/base.entity';

export class RefreshTokenEntity extends BaseEntity {
  userId!: string;
  token!: string;
  expiresAt!: Date;
  isRevoked!: boolean;
}
