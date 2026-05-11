import { LoginDTO, AuthResponseDTO } from '../dtos/auth.dto';
import { IUsersRepository } from '../../users/repositories/users.repository';
import { IHashProvider } from '../../../shared/providers/HashProvider';
import { ITokenProvider } from '../../../shared/providers/TokenProvider';

export class AuthService {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly hashProvider: IHashProvider,
    private readonly tokenProvider: ITokenProvider
  ) {}

  async authenticate(data: LoginDTO): Promise<AuthResponseDTO> {
    const user = await this.usersRepository.findByEmail(data.email, data.companyId);

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    const passwordMatched = await this.hashProvider.compareHash(data.passwordString, user.passwordHash);

    if (!passwordMatched) {
      throw new Error('Invalid credentials');
    }

    const jwtSecret = process.env.JWT_SECRET || 'default_secret';

    let roleName = user.roleName || user.role?.name || 'EMPLOYEE';
    
    const permissions = user.role?.permissions?.map(p => p.permissionKey) || [];

    const accessToken = this.tokenProvider.generateToken(
      { sub: user.id, companyId: user.companyId, role: roleName },
      jwtSecret,
      '1h'
    );
    
    const refreshToken = this.tokenProvider.generateToken(
      { sub: user.id },
      jwtSecret,
      '7d'
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        roleId: user.roleId,
        roleName,
        permissions,
        companyId: user.companyId!,
      }
    };
  }
}
