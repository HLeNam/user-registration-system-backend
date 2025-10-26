import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
}

@Injectable()
export class CookieService {
  constructor(private configService: ConfigService) {}

  setAccessTokenCookie(response: Response, token: string): void {
    const cookieName =
      this.configService.get('ACCESS_TOKEN_COOKIE_NAME') || 'access_token';
    const options = this.getAccessTokenCookieOptions();

    response.cookie(cookieName, token, options);
  }

  setRefreshTokenCookie(response: Response, token: string): void {
    const cookieName =
      this.configService.get('REFRESH_TOKEN_COOKIE_NAME') || 'refresh_token';
    const options = this.getRefreshTokenCookieOptions();

    response.cookie(cookieName, token, options);
  }

  clearAuthCookies(response: Response): void {
    const accessTokenName =
      this.configService.get('ACCESS_TOKEN_COOKIE_NAME') || 'access_token';
    const refreshTokenName =
      this.configService.get('REFRESH_TOKEN_COOKIE_NAME') || 'refresh_token';

    response.clearCookie(accessTokenName, this.getBaseCookieOptions());
    response.clearCookie(refreshTokenName, this.getBaseCookieOptions());
  }

  private getAccessTokenCookieOptions(): CookieOptions {
    return {
      ...this.getBaseCookieOptions(),
      maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    };
  }

  private getRefreshTokenCookieOptions(): CookieOptions {
    return {
      ...this.getBaseCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    };
  }

  private getBaseCookieOptions(): CookieOptions {
    const isProduction = this.configService.get('ENV_NODE') === 'production';

    return {
      httpOnly: true, // Prevent XSS
      secure:
        isProduction || this.configService.get('COOKIE_SECURE') === 'true',
      sameSite: (this.configService.get('COOKIE_SAME_SITE') as any) || 'lax',
      path: '/',
    };
  }
}
