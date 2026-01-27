// src/entities/users/user.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { UserStatus } from './user-status.entity';

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

    @Column({ type: 'datetime', nullable: true })
    last_login_at: Date | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
