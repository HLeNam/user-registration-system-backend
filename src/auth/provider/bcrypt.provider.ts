import { Injectable } from '@nestjs/common';
import { HashingProvider } from './hashing.provider';

import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptProvider implements HashingProvider {
  async hash(data: string | Buffer): Promise<string> {
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);

    return await bcrypt.hash(data, salt);
  }

  async compare({
    plain,
    hashed,
  }: {
    plain: string | Buffer;
    hashed: string | Buffer;
  }): Promise<boolean> {
    console.log('🚀 ~ BcryptProvider ~ compare ~ hashed:', hashed);
    console.log('🚀 ~ BcryptProvider ~ compare ~ plain:', plain);
    return await bcrypt.compare(plain, hashed.toString());
  }
}
