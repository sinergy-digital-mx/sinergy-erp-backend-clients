// src/entities/leads/lead-activity.entity.ts
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
import { Lead } from './lead.entity';
import { User } from '../users/user.entity';
import { RBACTenant } from '../rbac/tenant.entity';

export enum ActivityType {
    CALL = 'call',
    EMAIL = 'email',
    MEETING = 'meeting',
    NOTE = 'note',
    TASK = 'task',
    FOLLOW_UP = 'follow_up',
}

export enum ActivityStatus {
    COMPLETED = 'completed',
    SCHEDULED = 'scheduled',
    CANCELLED = 'cancelled',
    IN_PROGRESS = 'in_progress',
}

@Entity('lead_activities')
@Index('lead_activity_tenant_index', ['lead_id', 'tenant_id'])
@Index('lead_activity_user_index', ['user_id', 'tenant_id'])
@Index('lead_activity_type_index', ['type', 'tenant_id'])
@Index('lead_activity_date_index', ['activity_date', 'tenant_id'])
export class LeadActivity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Lead, lead => lead.activities, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'lead_id' })
    lead: Lead;

    @Column({ name: 'lead_id' })
    lead_id: number;

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
        enum: ActivityType,
        default: ActivityType.CALL,
    })
    type: ActivityType;

    @Column({
        type: 'enum',
        enum: ActivityStatus,
        default: ActivityStatus.COMPLETED,
    })
    status: ActivityStatus;

    @Column({ length: 200 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'timestamp' })
    activity_date: Date;

    @Column({ type: 'int', nullable: true, comment: 'Duration in minutes' })
    duration_minutes: number;

    @Column({ length: 100, nullable: true })
    outcome: string; // 'interested', 'not_interested', 'callback_requested', 'meeting_scheduled', etc.

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