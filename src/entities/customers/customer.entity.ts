// src/entities/customers/customer.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { CustomerStatus } from './customer-status.entity';
import { CustomerAddress } from './customer-address.entity';
import { CustomerGroup } from './customer-group.entity';
import { CustomerActivity } from './customer-activity.entity';
import { RBACTenant } from '../rbac/tenant.entity';
import { Contract } from '../contracts/contract.entity';
import { Warehouse } from '../warehouse/warehouse.entity';

@Entity('customers')
export class Customer {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => RBACTenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: RBACTenant;

    @Column({ name: 'tenant_id' })
    tenant_id: string;

    @ManyToOne(() => CustomerStatus)
    @JoinColumn({ name: 'status_id' })
    status: CustomerStatus;

    @Column({ name: 'status_id', nullable: true })
    status_id: number | null;

    @Column()
    name: string;

    @Column({ nullable: true })
    lastname: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ length: 2, nullable: true })
    phone_country: string;

    @Column({ length: 5, nullable: true })
    phone_code: string;

    @Column({ nullable: true })
    country: string;

    @Column({ nullable: true })
    company_name: string;

    @Column({ nullable: true })
    website: string;

    @ManyToOne(() => CustomerGroup, group => group.customers)
    @JoinColumn({ name: 'group_id' })
    group: CustomerGroup;

    @Column({ name: 'group_id', nullable: true })
    group_id: string | null;

    @Column({ nullable: true })
    additional_name: string;

    @Column({ nullable: true })
    additional_lastname: string;

    @Column({ nullable: true })
    additional_email: string;

    @Column({ nullable: true })
    additional_phone: string;

    @Column({ length: 2, nullable: true })
    additional_phone_country: string;

    @Column({ length: 10, nullable: true })
    additional_phone_code: string;

    @Column({ nullable: true, length: 20 })
    fiscal_rfc: string;

    @Column({ nullable: true })
    fiscal_razon_social: string;

    @Column({ nullable: true, length: 20 })
    fiscal_person_type: string;

    @Column({ nullable: true })
    fiscal_address: string;

    @Column({ nullable: true })
    fiscal_city: string;

    @Column({ nullable: true })
    fiscal_state: string;

    @Column({ nullable: true, length: 20 })
    fiscal_postal_code: string;

    @ManyToOne(() => Warehouse, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'warehouse_id' })
    warehouse: Warehouse | null;

    @Column({ nullable: true })
    warehouse_id: string;

    @Column({ type: 'int', nullable: true })
    credit_days: number;

    @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
    credit_amount: number;

    @Column({ type: 'int', nullable: true })
    legacy_customer_id: number;

    @OneToMany(() => CustomerAddress, address => address.customer)
    addresses: CustomerAddress[];

    @OneToMany(() => CustomerActivity, activity => activity.customer)
    activities: CustomerActivity[];

    @OneToMany(() => Contract, contract => contract.customer)
    contracts: Contract[];

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}
