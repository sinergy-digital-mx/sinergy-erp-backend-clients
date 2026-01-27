// src/entities/leads/lead.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { LeadStatus } from './lead-status.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity('leads')
export class Lead {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

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

    @CreateDateColumn()
    created_at: Date;
}
