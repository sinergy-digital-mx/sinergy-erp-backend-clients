// src/entities/users/user.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { UserStatus } from './user-status.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @ManyToOne(() => UserStatus)
    @JoinColumn({ name: 'status_id' })
    status: UserStatus;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @CreateDateColumn()
    created_at: Date;
}
