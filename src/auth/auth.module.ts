import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HashingProvider } from 'src/auth/provider/hashing.provider';
import { BcryptProvider } from 'src/auth/provider/bcrypt.provider';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import authConfig from 'src/auth/config/auth.config';
import { UsersModule } from 'src/users/users.module';
import { JwtAuthService } from 'src/auth/jwt.service';
import { AuthController } from './auth.controller';

@Module({
  providers: [
    AuthService,
    {
      provide: HashingProvider,
      useClass: BcryptProvider,
    },
    JwtAuthService,
  ],
  controllers: [AuthController],
  exports: [HashingProvider],
  imports: [
    forwardRef(() => UsersModule),
    ConfigModule.forFeature(authConfig),
    JwtModule.registerAsync(authConfig.asProvider()),
  ],
})
export class AuthModule {}
