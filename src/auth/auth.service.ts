import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from '../users/dto/login-dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { ActivateAccountDto } from 'src/users/dto/activate-account.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto, currentUser: User) {
    return this.usersService.create(dto, currentUser);
  }

  async activate(dto: ActivateAccountDto) {
    return this.usersService.activateAccount(dto);
  }

  async updateUser(id: number, dto: UpdateUserDto, currentUser: User) {
    return this.usersService.updateUser(id, dto, currentUser);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Please activate your email before logging in.',
      );
    }

    const { accessToken, refreshToken } = this.generateToken(user);

    const hashed = await bcrypt.hash(refreshToken, 10);

    user.refreshToken = hashed;

    await this.usersService.updateUserRefreshToken(user, hashed);

    return { accessToken, refreshToken };
  }

  private generateToken(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload = { sub: user.id, email: user.email, role: user.roles };
    // return this.jwtService.sign(payload, { expiresIn });

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  async refresh(userId: number, incomingToken: string) {
    const payload = this.jwtService.verify(incomingToken);

    const user = await this.usersService.findById(userId);

    const isValid = await bcrypt.compare(
      incomingToken,
      user.refreshToken ?? '',
    );

    if (!isValid) throw new UnauthorizedException('Invalid refresh token');

    const { accessToken, refreshToken: newRefreshToken } =
      this.generateToken(user);
    const hashed = await bcrypt.hash(newRefreshToken, 10);
    await this.usersService.updateUserRefreshToken(user, hashed);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout() {
    return { message: 'Logout successful.' };
  }
}
