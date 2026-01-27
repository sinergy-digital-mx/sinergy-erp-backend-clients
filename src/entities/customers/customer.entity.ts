// src/entities/customers/customer.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { CustomerStatus } from './customer-status.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity('customers')
export class Customer {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @ManyToOne(() => CustomerStatus)
    @JoinColumn({ name: 'status_id' })
    status: CustomerStatus;

    @Column()
    name: string;

    @CreateDateColumn()
    created_at: Date;
}
