import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { Customer } from './customer.entity';
import { FiscalConfiguration } from '../billing/fiscal-configuration.entity';

/** Crédito del cliente por razón social (fiscal_configuration). No usa almacén. */
@Entity('customer_credits')
@Index('idx_customer_credits_tenant', ['tenant_id'])
@Index('uq_customer_credit_fiscal', ['tenant_id', 'customer_id', 'fiscal_configuration_id'], {
  unique: true,
})
export class CustomerCredit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  customer_id: number;

  @ManyToOne(() => FiscalConfiguration, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'fiscal_configuration_id' })
  fiscal_configuration: FiscalConfiguration;

  @Column()
  fiscal_configuration_id: string;

  @Column({ type: 'boolean', default: false })
  credit_enabled: boolean;

  @Column({ type: 'int', nullable: true })
  credit_days: number | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  credit_amount: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
