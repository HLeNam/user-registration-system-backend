import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthService } from '../jwt.service';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtAuthService: JwtAuthService,
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Try to get token from Authorization header first
    let token = this.extractTokenFromHeader(request);

    // If no token in header, try to get from cookie
    if (!token) {
      token = this.extractTokenFromCookie(request);
    }

    if (!token) {
      throw new UnauthorizedException('No authentication token found');
    }

    try {
      const payload = await this.jwtAuthService.verifyAccessToken(token);
      const user = await this.authService.findUserById(payload.sub);

      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | null {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return null;
    }

    const token = authorization.replace('Bearer ', '');
    return token || null;
  }

  private extractTokenFromCookie(request: any): string | null {
    const cookieName =
      this.configService.get('ACCESS_TOKEN_COOKIE_NAME') || 'access_token';
    return request.cookies?.[cookieName] || null;
  }
}
