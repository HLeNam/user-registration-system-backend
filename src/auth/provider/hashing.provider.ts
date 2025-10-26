import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class HashingProvider {
  abstract hash(data: string | Buffer): Promise<string>;

  abstract compare({
    plain,
    hashed,
  }: {
    plain: string | Buffer;
    hashed: string | Buffer;
  }): Promise<boolean>;
}
