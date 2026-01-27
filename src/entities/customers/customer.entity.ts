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
import { RBACTenant } from '../rbac/tenant.entity';

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

    @Column()
    name: string;

    @OneToMany(() => CustomerAddress, address => address.customer)
    addresses: CustomerAddress[];

    @CreateDateColumn()
    created_at: Date;
}
