import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { RegisterDto } from './dtos/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { type Request, type Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.registerUser(registerDto, response);
  }

  @Post('login')
  async login(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.loginUser(loginDto, response);
  }

  @Post('refresh')
  async refreshTokens(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    refreshTokenDto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    let refreshToken = refreshTokenDto.refreshToken;

    if (!refreshToken) {
      const cookieName =
        this.configService.get('REFRESH_TOKEN_COOKIE_NAME') || 'refresh_token';
      refreshToken = request.cookies?.[cookieName];
    }

    if (!refreshToken) {
      throw new Error('Refresh token not provided');
    }

    return this.authService.refreshTokens(refreshToken, response);
  }

  @Post('refresh-from-cookie')
  async refreshFromCookie(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookieName =
      this.configService.get('REFRESH_TOKEN_COOKIE_NAME') || 'refresh_token';
    const refreshToken = request.cookies?.[cookieName];

    if (!refreshToken) {
      throw new Error('Refresh token not found in cookies');
    }

    return this.authService.refreshTokens(refreshToken, response);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @GetUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(user.id, response);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@GetUser() user: User) {
    return {
      message: 'Profile retrieved successfully',
      data: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }
}
