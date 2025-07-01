import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles } from '../common/enums/role.enum';
import { JwtService } from '@nestjs/jwt';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { UserStatus } from '../common/enums/user-status.enum';
import { EmailService } from '../email/email.service';
import { Role } from 'src/entities/roles.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateUserDto, createdBy: User): Promise<User> {
    // console.log('creator id:', createdBy.id, 'role:', createdBy.roles);

    const existing = await this.findByEmail(dto.email);

    if (existing) throw new BadRequestException('Email already exists');

    const hasPermissionToCreate = createdBy.roles.some((role) =>
      [Roles.MD, Roles.HR].includes(role.name),
    );

    if (!hasPermissionToCreate) {
      throw new ForbiddenException('Only MD or HR can create workers');
    }

    const { activationToken, expiresAt } = this.generateToken({
      email: dto.email,
    });

    // Fetch roles based on provided dto.role
    const rolesToAssign = Array.isArray(dto.role) ? dto.role : [dto.role];
    const roleEntities = await this.roleRepo.findBy({
      name: In(rolesToAssign),
    });

    if (roleEntities.length === 0) {
      throw new BadRequestException('Invalid role(s) provided');
    }

    const user = this.userRepo.create({
      ...dto,
      status: UserStatus.PENDING,
      password: '',
      activationToken,
      activationTokenExpires: expiresAt,
      createdBy,
      roles: roleEntities,
    });

    const savedUser = await this.userRepo.save(user);

    await this.emailService.sendActivationEmail(user.email, activationToken);

    return savedUser;
  }

  private generateToken(user: { email: string }): {
    activationToken: string;
    expiresAt: Date;
  } {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const payload = {
      email: user.email,
      type: 'activation',
    };

    const activationToken = this.jwtService.sign(payload);
    return { activationToken, expiresAt };
  }

  async activateAccount(dto: ActivateAccountDto): Promise<User> {
    try {
      const decoded = this.jwtService.verify(dto.token, {
        ignoreExpiration: false,
      });
    } catch (err) {
      throw new BadRequestException('Activation token expired or invalid');
    }

    const user = await this.userRepo.findOne({
      where: { activationToken: dto.token },
    });

    if (!user) throw new BadRequestException('Invalid activation token');

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Account is already active');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    user.password = hashed;
    user.status = UserStatus.ACTIVE;
    user.activationToken = null;
    user.activationTokenExpires = null;

    await this.userRepo.save(user);

    return user;
  }

  async updateUserRefreshToken(user: User, hashedToken: string): Promise<void> {
    await this.userRepo.update(user?.id, { refreshToken: hashedToken });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
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

    if (dto.role) {
      const rolesToAssign = Array.isArray(dto.role) ? dto.role : [dto.role];
      const canAssignAll = rolesToAssign.every((role) =>
        this.canAssignRole(currentUser, role),
      );

      if (!canAssignAll) {
        throw new ForbiddenException('You cannot assign this role');
      }

      if (dto.role) {
        const rolesToAssign = Array.isArray(dto.role) ? dto.role : [dto.role];

        const canAssignAll = rolesToAssign.every((role) =>
          this.canAssignRole(currentUser, role),
        );
        if (!canAssignAll) {
          throw new ForbiddenException(
            'You cannot assign one or more of the roles',
          );
        }

        // 🔧 Fetch matching Role entities
        const roleEntities = await this.roleRepo.findBy({
          name: In(rolesToAssign.map((r) => r.toUpperCase())),
        });

        if (roleEntities.length !== rolesToAssign.length) {
          throw new BadRequestException('One or more roles are invalid');
        }

        userToUpdate.roles = roleEntities;
      }
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
    const currentRoles = currentUser.roles.map((role) => role.name);
    const targetRoles = targetUser.roles.map((role) => role.name);

    // MD can modify anyone
    if (currentRoles.includes(Roles.MD)) {
      return true;
    }

    // HR can modify non-MD users
    if (currentRoles.includes(Roles.HR) && !targetRoles.includes(Roles.MD)) {
      return true;
    }

    // Users can modify themselves (for profile updates)
    if (currentUser.id === targetUser.id) {
      return true;
    }

    return false;
  }

  private canAssignRole(currentUser: User, roleToAssign: Roles): boolean {
    const currentRoles = currentUser.roles.map((role) => role.name);

    // Only MD can assign MD role
    if (roleToAssign === Roles.MD) {
      return currentRoles.includes(Roles.MD);
    }

    // MD and HR can assign other roles
    return currentRoles.some((role) => [Roles.MD, Roles.HR].includes(role));
  }
}
