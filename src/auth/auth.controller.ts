import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RolesGuard } from './guards/role.guard';
import { HasRoles } from './decorators/role.decorator';
import { Roles } from '../common/enums/role.enum';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ActivateAccountDto } from '../users/dto/activate-account.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { AuthService } from './auth.service';
import { LoginDto } from '../users/dto/login-dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @HasRoles(Roles.MD, Roles.HR)
  async registerWorker(@Body() dto: CreateUserDto, @CurrentUser() user: User) {
    return this.authService.register(dto, user);
  }

  @Post('activate')
  async activateAccount(@Body() dto: ActivateAccountDto) {
    return this.authService.activate(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return result;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(Roles.MD, Roles.HR)
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    return this.authService.updateUser(+id, dto, user);
  }

  @Post('logout')
  async logout() {
    return this.authService.logout();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(Roles.MD, Roles.HR)
  async removeUser(@Param('id') id: string, @CurrentUser() user: User) {
    return this.usersService.removeUser(+id, user);
  }
}
