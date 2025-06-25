import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/common/enums/role.enum';
import { JwtService } from '@nestjs/jwt';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { UserStatus } from 'src/common/enums/user-status.enum';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateUserDto, createdBy: User): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already exists');

    if (![Role.MD, Role.HR].includes(createdBy.role)) {
      throw new ForbiddenException('Only MD or HR can create workers');
    }

    const { activationToken, expiresAt } = this.generateToken(dto as User);

    const user = this.userRepo.create({
      ...dto,
      status: UserStatus.PENDING,
      password: '',
      activationToken,
      activationTokenExpires: expiresAt,
      createdBy,
    });

    const savedUser = await this.userRepo.save(user);

    await this.emailService.sendActivationEmail(user.email, activationToken);

    return savedUser;
  }

  private generateToken(user: User): {
    activationToken: string;
    expiresAt: Date;
  } {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const payload = {
      sub: user.id,
      email: user.email,
      type: 'activation',
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    const activationToken = this.jwtService.sign(payload);
    return { activationToken, expiresAt };
  }

  async activateAccount({
    token,
    password,
  }: ActivateAccountDto): Promise<User> {
    try {
      const decoded = this.jwtService.verify(token, {
        ignoreExpiration: false,
      });
    } catch (err) {
      throw new BadRequestException('Activation token expired or invalid');
    }

    const user = await this.userRepo.findOne({
      where: { activationToken: token },
    });

    if (!user) throw new BadRequestException('Invalid activation token');

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Account is already active');
    }

    const hashed = await bcrypt.hash(password, 10);

    user.password = hashed;
    user.status = UserStatus.ACTIVE;
    user.activationToken = null;
    user.activationTokenExpires = null;

    await this.userRepo.save(user);

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(
    id: number,
    dto: UpdateUserDto,
    currentUser: User,
  ): Promise<User> {
    const userToUpdate = await this.findById(id);

    const canUpdate = this.canModifyUser(currentUser, userToUpdate);

    if (!canUpdate) {
      throw new ForbiddenException(
        'You do not have permission to update this user',
      );
    }

    if (dto.role && !this.canAssignRole(currentUser, dto.role)) {
      throw new ForbiddenException('You cannot assign this role');
    }

    if (dto.email && dto.email !== userToUpdate.email) {
      const existingUser = await this.findByEmail(dto.email);
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    Object.assign(userToUpdate, dto);
    return this.userRepo.save(userToUpdate);
  }

  async removeUser(id: number, currentUser: User): Promise<void> {
    const userToDelete = await this.findById(id);

    const canDelete = this.canModifyUser(currentUser, userToDelete);

    if (!canDelete) {
      throw new ForbiddenException(
        'You do not have permission to delete this user',
      );
    }

    if (currentUser.id === userToDelete.id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    await this.userRepo.remove(userToDelete);
  }

  private canModifyUser(currentUser: User, targetUser: User): boolean {
    // MD can modify anyone
    if (currentUser.role === Role.MD) {
      return true;
    }

    // HR can modify non-MD users
    if (currentUser.role === Role.HR && targetUser.role !== Role.MD) {
      return true;
    }

    // Users can modify themselves (for profile updates)
    if (currentUser.id === targetUser.id) {
      return true;
    }

    return false;
  }

  private canAssignRole(currentUser: User, roleToAssign: Role): boolean {
    // Only MD can assign MD role
    if (roleToAssign === Role.MD) {
      return currentUser.role === Role.MD;
    }

    // MD and HR can assign other roles
    return [Role.MD, Role.HR].includes(currentUser.role);
  }
}
