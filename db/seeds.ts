import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Role } from 'src/common/enums/role.enum';
import { UserStatus } from 'src/common/enums/user-status.enum';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepo = app.get<Repository<User>>('UserRepository');

  const existing = await userRepo.findOne({
    where: { email: 'md@example.com' },
  });

  if (existing) {
    process.exit(0);
  }

  const md = userRepo.create({
    email: 'md@example.com',
    password: await bcrypt.hash('StrongPassword123', 10),
    role: Role.MD,
    status: UserStatus.ACTIVE,
  });

  await userRepo.save(md);
  process.exit(0);
}
bootstrap();
