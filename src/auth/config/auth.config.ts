import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  sharedSecret: process.env.SECRET_KEY,
  secret: process.env.JWT_TOKEN_SECRET,
  expiresIn: parseInt(process.env.JWT_TOKEN_EXPIRES_IN ?? '3600', 10),
  refreshExpiresIn: parseInt(
    process.env.JWT_REFRESH_TOKEN_EXPIRES_IN ?? '86400',
    10,
  ),
  audience: process.env.JWT_TOKEN_AUDIENCE,
  issuer: process.env.JWT_TOKEN_ISSUER,
}));
