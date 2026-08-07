// src/entities/customers/customer-address.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { RBACTenant } from '../rbac/tenant.entity';

@Entity('customer_addresses')
export class CustomerAddress {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Customer, customer => customer.addresses)
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @Column()
    customer_id: number;

    @ManyToOne(() => RBACTenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: RBACTenant;

    @Column({ name: 'tenant_id' })
    tenant_id: string;

    @Column()
    type: string; // 'billing', 'shipping', 'primary'

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

    @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
    latitude: number | null;

    @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
    longitude: number | null;

    @Column({ type: 'tinyint', default: 0 })
    has_gps: number;

    @Column({ type: 'varchar', length: 40, nullable: true })
    address_source: string | null;

    @Column({ type: 'tinyint', default: 1 })
    status: number;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}