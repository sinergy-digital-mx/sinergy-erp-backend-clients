import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Customer } from './customer.entity';
import { User } from '../users/user.entity';
import { RBACTenant } from '../rbac/tenant.entity';

export enum CustomerActivityType {
    CALL = 'call',
    EMAIL = 'email',
    MEETING = 'meeting',
    NOTE = 'note',
    TASK = 'task',
    FOLLOW_UP = 'follow_up',
    PURCHASE = 'purchase',
    SUPPORT = 'support',
}

export enum CustomerActivityStatus {
    COMPLETED = 'completed',
    SCHEDULED = 'scheduled',
    CANCELLED = 'cancelled',
    IN_PROGRESS = 'in_progress',
}

@Entity('customer_activities')
@Index('customer_activity_tenant_index', ['customer_id', 'tenant_id'])
@Index('customer_activity_user_index', ['user_id', 'tenant_id'])
@Index('customer_activity_type_index', ['type', 'tenant_id'])
@Index('customer_activity_date_index', ['activity_date', 'tenant_id'])
export class CustomerActivity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Customer, customer => customer.activities, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @Column({ type: 'int' })
    customer_id: number;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id', nullable: true })
    user_id: string;

    @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id' })
    tenant: RBACTenant;

    @Column({ name: 'tenant_id' })
    tenant_id: string;

    @Column({
        type: 'enum',
        enum: CustomerActivityType,
        default: CustomerActivityType.NOTE,
    })
    type: CustomerActivityType;

    @Column({
        type: 'enum',
        enum: CustomerActivityStatus,
        default: CustomerActivityStatus.COMPLETED,
    })
    status: CustomerActivityStatus;

    @Column({ length: 200 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'timestamp' })
    activity_date: Date;

    @Column({ type: 'int', nullable: true, comment: 'Duration in minutes' })
    duration_minutes: number;

    @Column({ length: 100, nullable: true })
    outcome: string; // 'satisfied', 'issue_resolved', 'escalated', 'follow_up_needed', etc.

    @Column({ type: 'timestamp', nullable: true })
    follow_up_date: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any>; // For additional custom fields

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}
