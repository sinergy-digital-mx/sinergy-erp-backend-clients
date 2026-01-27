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
import { RBACTenant } from '../rbac/tenant.entity';

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

    @CreateDateColumn()
    created_at: Date;
}
