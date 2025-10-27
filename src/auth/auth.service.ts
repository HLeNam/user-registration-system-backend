import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import authConfig from './config/auth.config';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { JwtAuthService } from './jwt.service';
import { HashingProvider } from './provider/hashing.provider';
import { UsersService } from '../users/users.service';
import { CookieService } from '../common/services/cookie.service';
import { type Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,

    private readonly hashingProvider: HashingProvider,

    private readonly jwtService: JwtService,

    private jwtAuthService: JwtAuthService,

    private cookieService: CookieService,
  ) {}

  async registerUser(registerDto: RegisterDto, response?: Response) {
    const { email, password } = registerDto;

    const newUser = await this.usersService.createUser({
      email,
      password,
    });

    const tokens = await this.jwtAuthService.generateTokens(newUser);
    const now = Math.floor(Date.now() / 1000);

    await this.usersService.updateUserRefreshToken(
      newUser.id,
      tokens.refreshToken,
      new Date(tokens.refreshTokenExpiresAt * 1000),
      new Date(now * 1000),
    );

    if (response) {
      this.cookieService.setAccessTokenCookie(
        response,
        tokens.accessToken,
        tokens.accessTokenExpiresAt,
      );
      this.cookieService.setRefreshTokenCookie(
        response,
        tokens.refreshToken,
        tokens.refreshTokenExpiresAt,
      );
    }

    return {
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
        tokens,
      },
    };
  }

  async loginUser(loginDto: LoginDto, response?: Response) {
    const { email, password } = loginDto;

    const foundUser = await this.usersService.findUserByEmail(email);

    if (!foundUser) {
      throw new BadRequestException('Invalid email or password');
    }

    const isPasswordValid = await this.hashingProvider.compare({
      plain: password,
      hashed: foundUser.password,
    });

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }

    const tokens = await this.jwtAuthService.generateTokens(foundUser);
    const now = Math.floor(Date.now() / 1000);

    await this.usersService.updateUserRefreshToken(
      foundUser.id,
      tokens.refreshToken,
      new Date(tokens.refreshTokenExpiresAt * 1000),
      new Date(now * 1000),
    );

    if (response) {
      this.cookieService.setAccessTokenCookie(
        response,
        tokens.accessToken,
        tokens.accessTokenExpiresAt,
      );
      this.cookieService.setRefreshTokenCookie(
        response,
        tokens.refreshToken,
        tokens.refreshTokenExpiresAt,
      );
    }

    return {
      message: 'Login successful',
      data: {
        user: {
          id: foundUser.id,
          email: foundUser.email,
          createdAt: foundUser.createdAt,
        },
        tokens,
      },
    };
  }

  async refreshTokens(refreshToken: string, response?: Response) {
    const payload = await this.jwtAuthService.verifyRefreshToken(refreshToken);

    const foundUser = await this.usersService.findUserById(payload.sub);

    if (!foundUser || !foundUser.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Verify refresh token còn hiệu lực
    await this.jwtAuthService.verifyRefreshToken(foundUser.refreshToken);

    const isRefreshTokenValid = refreshToken === foundUser.refreshToken;

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const now = Math.floor(Date.now() / 1000);
    const currentExpiresAt = Math.floor(
      foundUser.refreshTokenExpiresAt.getTime() / 1000,
    );

    // Check nếu token đã hết hạn
    if (now >= currentExpiresAt) {
      await this.usersService.updateUserRefreshToken(
        foundUser.id,
        null,
        null,
        null,
      );
      throw new UnauthorizedException(
        'Refresh token has expired. Please login again.',
      );
    }

    // Generate new tokens với thời gian còn lại
    const tokens = await this.jwtAuthService.generateTokens(foundUser, {
      existingRefreshTokenExpiresAt: currentExpiresAt,
    });

    // Giữ nguyên expiresAt cũ - không reset
    const expiresAt = currentExpiresAt;

    await this.usersService.updateUserRefreshToken(
      foundUser.id,
      tokens.refreshToken,
      new Date(expiresAt * 1000),
      foundUser.refreshTokenIssuedAt,
    );

    if (response) {
      this.cookieService.setAccessTokenCookie(
        response,
        tokens.accessToken,
        tokens.accessTokenExpiresAt,
      );
      this.cookieService.setRefreshTokenCookie(
        response,
        tokens.refreshToken,
        expiresAt,
      );
    }

    return {
      message: 'Tokens refreshed successfully',
      data: { tokens },
    };
  }

  async logout(userId: string, response?: Response) {
    await this.usersService.updateUserRefreshToken(userId, null, null, null);

    if (response) {
      this.cookieService.clearAuthCookies(response);
    }

    return {
      message: 'Logout successful',
    };
  }

  async findUserById(userId: string) {
    return await this.usersService.findUserById(userId);
  }
}
