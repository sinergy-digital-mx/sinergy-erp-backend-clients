import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { Customer } from './customer.entity';

@Entity('customer_groups')
@Index('idx_customer_groups_tenant', ['tenant_id'])
export class CustomerGroup {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'tenant_id' })
    tenant: RBACTenant;

    @Column({ name: 'tenant_id' })
    tenant_id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    /**
     * Grupos históricos (p. ej. Divino) que no se pueden eliminar.
     * El UUID se conserva; no recrear ni reasignar el id.
     */
    @Column({ type: 'boolean', default: false })
    is_system: boolean;

    @OneToMany(() => Customer, customer => customer.group)
    customers: Customer[];

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}
