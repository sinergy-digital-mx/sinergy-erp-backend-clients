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
import { RBACTenant } from '../rbac/tenant.entity';
import { UserStatus } from './user-status.entity';
import { BillingBranch } from '../billing/billing-branch.entity';
import { PosUserType } from './pos-user-type.enum';

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

    @Column({ nullable: true })
    first_name: string;

    @Column({ nullable: true })
    last_name: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    language_code: string;

    @Column({ type: 'timestamp', nullable: true })
    last_login_at: Date | null;

    @Column({ type: 'integer', default: 1 })
    permissions_version: number;

    @Column({ name: 'billing_branch_id', nullable: true })
    billing_branch_id: string | null;

    @ManyToOne(() => BillingBranch, { nullable: true })
    @JoinColumn({ name: 'billing_branch_id' })
    billing_branch: BillingBranch | null;

    @Column({ type: 'tinyint', default: 0 })
    is_pos_user: boolean;

    @Column({ type: 'int', nullable: true })
    pos_user_code: number | null;

    @Column({
      type: 'enum',
      enum: PosUserType,
      nullable: true,
    })
    pos_user_type: PosUserType | null;

    @Column({ type: 'tinyint', default: 0 })
    is_employee: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}
