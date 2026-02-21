// src/entities/leads/lead.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { LeadStatus } from './lead-status.entity';
import { LeadAddress } from './lead-address.entity';
import { LeadActivity } from './lead-activity.entity';
import { LeadGroup } from './lead-group.entity';
import { RBACTenant } from '../rbac/tenant.entity';
import { EmailThread } from '../email/email-thread.entity';

@Entity('leads')
export class Lead {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => RBACTenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: RBACTenant;

    @Column({ name: 'tenant_id' })
    tenant_id: string;

    @ManyToOne(() => LeadStatus)
    @JoinColumn({ name: 'status_id' })
    status: LeadStatus;

    @ManyToOne(() => LeadGroup, group => group.leads)
    @JoinColumn({ name: 'group_id' })
    group: LeadGroup;

    @Column({ name: 'group_id', nullable: true })
    group_id: string;

    @Column()
    name: string;

    @Column()
    lastname: string;

    @Column()
    email: string;

    @Column()
    phone: string;

    @Column({ length: 2 })
    phone_country: string;

    @Column({ length: 5 })
    phone_code: string;

    @Column({ nullable: true })
    source: string;

    @Column({ nullable: true })
    company_name: string;

    @Column({ nullable: true })
    company_phone: string;

    @Column({ nullable: true })
    website: string;

    @OneToMany(() => LeadAddress, address => address.lead)
    addresses: LeadAddress[];

    @OneToMany(() => LeadActivity, activity => activity.lead)
    activities: LeadActivity[];

    @OneToMany(() => EmailThread, thread => thread.lead)
    emailThreads: EmailThread[];

    @Column({ nullable: true })
    assigned_rep_id: string;

    @Column({ default: false })
    email_contacted: boolean;

    @Column({ type: 'timestamp', nullable: true })
    first_email_sent_at: Date;

    @Column({ default: false })
    customer_answered: boolean;

    @Column({ type: 'timestamp', nullable: true })
    customer_answered_at: Date;

    @Column({ default: false })
    agent_replied_back: boolean;

    @Column({ type: 'timestamp', nullable: true })
    agent_replied_back_at: Date;

    @Column({ nullable: true })
    last_email_thread_status: 'draft' | 'sent' | 'replied' | 'closed' | 'archived';

    @Column({ nullable: true })
    last_email_thread_id: string;

    @Column({ default: 0 })
    email_thread_count: number;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}
