// src/entities/users/user.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { UserStatus } from './user-status.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => RBACTenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: RBACTenant;

    @Column({ name: 'tenant_id' })
    tenant_id: string;

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
