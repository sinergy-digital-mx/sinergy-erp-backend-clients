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

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}