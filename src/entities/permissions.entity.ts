import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './roles.entity';
import { Permissions } from 'src/common/enums/permissions.enum';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: Permissions;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Role, (role) => role.permissions, {
    cascade: true,
  })
  roles: Role[];
}
