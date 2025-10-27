import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingProvider } from '../auth/provider/hashing.provider';
import { DuplicateException } from '../common/exceptions/custom.exceptions';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @Inject(forwardRef(() => HashingProvider))
    private readonly hashingProvider: HashingProvider,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    const existingUser = await this.usersRepository.findOne({
      where: [{ email: email }],
    });

    if (existingUser) {
      throw new DuplicateException('email', email);
    }

    const hashedPassword = await this.hashingProvider.hash(password);

    const newUser = this.usersRepository.create({
      email,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(newUser);

    return savedUser;
  }

  async updateUserRefreshToken(
    userId: string,
    refreshToken: string | null,
    expiresAt?: Date | null,
    issuedAt?: Date | null,
  ) {
    const updateData: any = {
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
    };

    if (issuedAt !== undefined) {
      updateData.refreshTokenIssuedAt = issuedAt;
    }

    return await this.usersRepository.update(userId, updateData);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email: email } });
  }

  async findUserById(userId: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { id: userId } });
  }
}
