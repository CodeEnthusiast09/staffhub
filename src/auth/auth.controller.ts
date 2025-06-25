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
import { UsersService } from 'src/users/users.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RolesGuard } from './guards/role.guard';
import { Roles } from './decorators/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ActivateAccountDto } from 'src/users/dto/activate-account.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MD, Role.HR)
  async registerWorker(@Body() dto: CreateUserDto, @Request() req) {
    return this.usersService.create(dto, req.user);
  }

  @Post('activate')
  async activateAccount(@Body() dto: ActivateAccountDto) {
    return this.usersService.activateAccount(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MD, Role.HR)
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req,
  ) {
    return this.usersService.updateUser(+id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MD, Role.HR)
  async removeUser(@Param('id') id: string, @Request() req) {
    return this.usersService.removeUser(+id, req.user);
  }
}
