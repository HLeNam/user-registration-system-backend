import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import authConfig from './config/auth.config';
import { ActiveUserType } from './interfaces/active-user-type.interface';
import { JwtPayload } from '../common/interfaces/api-response.interface';
import { User } from '../users/entities/user.entity';
import {
  GenerateTokensOptions,
  TokenWithExpiry,
} from './interfaces/token.interface';

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

  async generateTokens(
    user: User,
    options?: GenerateTokensOptions,
  ): Promise<TokenWithExpiry> {
    const now = Math.floor(Date.now() / 1000);
    const accessTokenExpiresAt = now + this.authConfiguration.expiresIn;

    // Nếu refresh token tồn tại, dùng expiry cũ (giảm dần)
    // Nếu không, tính mới (7 ngày từ hiện tại)
    const refreshTokenExpiresAt =
      options?.existingRefreshTokenExpiresAt ||
      now + this.authConfiguration.refreshExpiresIn;

    // Tính expiresIn cho JWT dựa trên refreshTokenExpiresAt
    const jwtRefreshExpiresIn = Math.max(
      refreshTokenExpiresAt - now,
      this.authConfiguration.refreshExpiresIn,
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserType>>(
        user.id,
        this.authConfiguration.expiresIn,
        { email: user.email, tokenType: 'access' },
      ),
      this.signToken(user.id, jwtRefreshExpiresIn, {
        email: user.email,
        tokenType: 'refresh',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      refreshTokenIssuedAt: options?.existingRefreshTokenExpiresAt
        ? Math.floor(user.refreshTokenIssuedAt.getTime() / 1000)
        : now,
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

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('Access token has expired');
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

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('Refresh token has expired');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  extractTokenExpiry(token: string): number {
    try {
      const decoded = this.jwtService.decode(token) as any;
      return decoded?.exp || 0;
    } catch {
      return 0;
    }
  }
}
