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

    @Column({ nullable: true })
    lastname: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
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
    group_id: string;

    @OneToMany(() => CustomerAddress, address => address.customer)
    addresses: CustomerAddress[];

    @OneToMany(() => CustomerActivity, activity => activity.customer)
    activities: CustomerActivity[];

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}
