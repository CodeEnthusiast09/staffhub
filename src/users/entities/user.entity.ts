import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Role } from '../../entities/roles.entity';
import { UserStatus } from '../../common/enums/user-status.enum';
import { Exclude } from 'class-transformer';
import { Permissions } from '../../common/enums/permissions.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  // @Column({ type: 'enum', enum: Role })
  // role: Roles;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  activationToken: string | null;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  activationTokenExpires: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true })
  createdBy: User;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => Role, (role) => role.users, {
    cascade: true,
  })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  // Computed property to get all permissions from roles
  get permissions(): Permissions[] {
    if (!this.roles) return [];

    return this.roles.reduce((allPermissions, role) => {
      const rolePermissions = role.permissions?.map((p) => p.name) || [];
      return [...allPermissions, ...rolePermissions];
    }, [] as Permissions[]);
  }
}
