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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                accessTokenExpiresAt: { type: 'number' },
                refreshTokenExpiresAt: { type: 'number' },
                refreshTokenIssuedAt: { type: 'number' },
              },
            },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string' },
      },
    },
  })
  @Post('register')
  async register(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.registerUser(registerDto, response);
  }

  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                accessTokenExpiresAt: { type: 'number' },
                refreshTokenExpiresAt: { type: 'number' },
                refreshTokenIssuedAt: { type: 'number' },
              },
            },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string' },
      },
    },
  })
  @Post('login')
  async login(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.loginUser(loginDto, response);
  }

  @ApiOperation({ summary: 'Refresh access tokens' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            accessTokenExpiresAt: { type: 'number' },
            refreshTokenExpiresAt: { type: 'number' },
            refreshTokenIssuedAt: { type: 'number' },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string' },
      },
    },
  })
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

  @ApiOperation({ summary: 'Refresh access tokens from cookie' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string' },
      },
    },
  })
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

  @ApiOperation({ summary: 'Logout a user' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string' },
      },
    },
  })
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @GetUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(user.id, response);
  }

  @ApiOperation({ summary: 'Get user profile' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string' },
      },
    },
  })
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
