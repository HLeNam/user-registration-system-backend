import { TokenPair } from '../../common/interfaces/api-response.interface';

export interface TokenWithExpiry extends TokenPair {
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
  refreshTokenIssuedAt: number;
}

export interface GenerateTokensOptions {
  existingRefreshTokenExpiresAt?: number;
}
