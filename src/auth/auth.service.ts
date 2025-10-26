import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import authConfig from 'src/auth/config/auth.config';
import { LoginDto } from 'src/auth/dtos/login.dto';
import { RegisterDto } from 'src/auth/dtos/register.dto';
import { JwtAuthService } from 'src/auth/jwt.service';
import { HashingProvider } from 'src/auth/provider/hashing.provider';
import { UsersService } from 'src/users/users.service';

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
  ) {}

  async registerUser(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    const newUser = await this.usersService.createUser({
      email,
      password,
    });

    const tokens = await this.jwtAuthService.generateTokens(newUser);

    await this.usersService.updateUserRefreshToken(
      newUser.id,
      tokens.refreshToken,
    );

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

  async loginUser(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const foundUser = await this.usersService.findUserByEmail(email);

    if (!foundUser) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.hashingProvider.compare({
      plain: password,
      hashed: foundUser.password,
    });

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.jwtAuthService.generateTokens(foundUser);

    await this.usersService.updateUserRefreshToken(
      foundUser.id,
      tokens.refreshToken,
    );

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

  async refreshTokens(refreshToken: string) {
    // Verify refresh token
    const payload = await this.jwtAuthService.verifyRefreshToken(refreshToken);

    // Find user
    const foundUser = await this.usersService.findUserById(payload.sub);

    if (!foundUser || !foundUser.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // check token is expired or not
    await this.jwtAuthService.verifyRefreshToken(foundUser.refreshToken);

    const isRefreshTokenValid = refreshToken === foundUser.refreshToken;

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = await this.jwtAuthService.generateTokens(foundUser);
    console.log('🚀 ~ AuthService ~ refreshTokens ~ tokens:', tokens);

    // Update refresh token
    await this.usersService.updateUserRefreshToken(
      foundUser.id,
      tokens.refreshToken,
    );

    return {
      message: 'Tokens refreshed successfully',
      data: { tokens },
    };
  }

  async logout(userId: string) {
    await this.usersService.updateUserRefreshToken(userId, null);
    return {
      message: 'Logout successful',
    };
  }

  async findUserById(userId: string) {
    return await this.usersService.findUserById(userId);
  }
}
