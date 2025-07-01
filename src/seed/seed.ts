import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { Roles } from '../common/enums/role.enum';
import { UserStatus } from '../common/enums/user-status.enum';
import * as bcrypt from 'bcryptjs';
import dataSource from '../../db/data-source';
import { Role } from '../entities/roles.entity';
import { Permission } from '../entities/permissions.entity';
import { Permissions } from '../common/enums/permissions.enum';

async function runSeed() {
  try {
    await dataSource.initialize();

    const userRepo = dataSource.getRepository(User);
    const roleRepo = dataSource.getRepository(Role);
    const permissionRepo = dataSource.getRepository(Permission);

    // 1. Seed permissions
    const permissions = Object.values(Permissions).map((name) =>
      permissionRepo.create({ name }),
    );
    await permissionRepo.save(permissions);
    console.log('✅ Permissions seeded');

    // 2. Seed roles and assign permissions to MD & HR
    const mdRole = roleRepo.create({
      name: Roles.MD,
      permissions,
    });

    const hrRole = roleRepo.create({
      name: Roles.HR,
      permissions: permissions.filter((p) =>
        [
          Permissions.CREATE_STAFF,
          Permissions.VIEW_STAFF,
          Permissions.EDIT_STAFF_DETAILS,
        ].includes(p.name),
      ),
    });

    const workerRole = roleRepo.create({
      name: Roles.WORKER,
      permissions: permissions.filter((p) =>
        [Permissions.VIEW_STAFF].includes(p.name),
      ),
    });

    await roleRepo.save([mdRole, hrRole, workerRole]);
    console.log('✅ Roles seeded');

    const existing = await userRepo.findOne({
      where: { email: 'admin@staffhub.com' },
    });

    if (existing) {
      console.log('✅ Seed user already exists.');
      return;
    }

    const md = userRepo.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@staffhub.com',
      password: await bcrypt.hash('StrngPwd_123', 10),
      status: UserStatus.ACTIVE,
      roles: [mdRole],
    });

    await userRepo.save(md);

    console.log('✅ MD user seeded.');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await dataSource.destroy();
  }
}

runSeed();
