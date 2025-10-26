import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: process.env.DB_TYPE || 'postgres',
  url: process.env.DB_URL,
  synchronize: process.env.DB_SYNCHRONIZE === 'true' ? true : false,
  autoLoadEntities: process.env.DB_AUTO_LOAD_ENTITIES === 'true' ? true : false,
}));
