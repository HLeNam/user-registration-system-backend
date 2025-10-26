import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HashingProvider } from './provider/hashing.provider';
import { BcryptProvider } from './provider/bcrypt.provider';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import authConfig from './config/auth.config';
import { UsersModule } from '../users/users.module';
import { JwtAuthService } from './jwt.service';
import { AuthController } from './auth.controller';
import { CookieService } from 'src/common/services/cookie.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Module({
  providers: [
    AuthService,
    {
      provide: HashingProvider,
      useClass: BcryptProvider,
    },
    JwtAuthService,
    CookieService,
    JwtAuthGuard,
  ],
  controllers: [AuthController],
  exports: [
    HashingProvider,
    JwtAuthService,
    AuthService,
    JwtAuthGuard,
    CookieService,
  ],
  imports: [
    forwardRef(() => UsersModule),
    ConfigModule.forFeature(authConfig),
    JwtModule.registerAsync(authConfig.asProvider()),
  ],
})
export class AuthModule {}
