// src/entities/leads/lead-address.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Lead } from './lead.entity';
import { RBACTenant } from '../rbac/tenant.entity';

@Entity('lead_addresses')
export class LeadAddress {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Lead, lead => lead.addresses)
    @JoinColumn({ name: 'lead_id' })
    lead: Lead;

    @ManyToOne(() => RBACTenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: RBACTenant;

    @Column({ name: 'tenant_id' })
    tenant_id: string;

    @Column()
    type: string; // 'home', 'work', 'mailing', 'primary'

    @Column()
    street_address: string;

    @Column({ nullable: true })
    street_address_2: string;

    @Column()
    city: string;

    @Column()
    state: string;

    @Column()
    postal_code: string;

    @Column()
    country: string;

    @Column({ default: false })
    is_primary: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}