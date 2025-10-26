import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import authConfig from './config/auth.config';
import { ActiveUserType } from './interfaces/active-user-type.interface';
import {
  JwtPayload,
  TokenPair,
} from '../common/interfaces/api-response.interface';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwtService: JwtService,

    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
  ) {}

  private async signToken<T>(userId: string, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        secret: this.authConfiguration.secret,
        expiresIn: expiresIn,
        audience: this.authConfiguration.audience,
        issuer: this.authConfiguration.issuer,
      },
    );
  }

  async generateTokens(user: User): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserType>>(
        user.id,
        this.authConfiguration.expiresIn,
        { email: user.email, tokenType: 'access' },
      ),
      this.signToken(user.id, this.authConfiguration.refreshExpiresIn, {
        email: user.email,
        tokenType: 'refresh',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.authConfiguration.secret,
      });

      if (payload.tokenType !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.authConfiguration.secret,
      });

      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
