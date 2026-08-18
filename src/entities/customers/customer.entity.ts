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
import { BillingBranch } from '../billing/billing-branch.entity';
import { User } from '../users/user.entity';

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

    /** Legado: calle + números + colonia concatenados. Preferir campos SAT. */
    @Column({ nullable: true })
    fiscal_address: string;

    @Column({ nullable: true, length: 255 })
    fiscal_street: string;

    @Column({ nullable: true, length: 20 })
    fiscal_exterior_number: string;

    @Column({ nullable: true, length: 20 })
    fiscal_interior_number: string;

    @Column({ nullable: true, length: 120 })
    fiscal_colonia: string;

    @Column({ nullable: true, length: 120 })
    fiscal_localidad: string;

    @Column({ nullable: true, length: 120 })
    fiscal_municipio: string;

    /** ISO SAT c_Pais, p. ej. MEX */
    @Column({ nullable: true, length: 3 })
    fiscal_country: string;

    /** Legado UI "Ciudad"; el SAT usa municipio (`fiscal_municipio`). */
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

    /** Sucursal donde se dio de alta. Solo informativo; no restringe compras. */
    @ManyToOne(() => BillingBranch, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'registered_billing_branch_id' })
    registered_billing_branch: BillingBranch | null;

    @Column({ name: 'registered_billing_branch_id', nullable: true })
    registered_billing_branch_id: string | null;

    /** Usuario que dio de alta al cliente. Solo informativo. */
    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'registered_by_user_id' })
    registered_by_user: User | null;

    @Column({ name: 'registered_by_user_id', nullable: true })
    registered_by_user_id: string | null;

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
