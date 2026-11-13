import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { Customer } from '../customers/customer.entity';
import { FiscalConfiguration } from '../billing/fiscal-configuration.entity';
import { BillingBranch } from '../billing/billing-branch.entity';
import { Product } from '../products/product.entity';
import { ProductUoM } from '../products/product-uom.entity';
import { ServiceSubscriptionStatus } from './service-subscription-status.enum';
import { ServiceSubscriptionPeriod } from './service-subscription-period.entity';

@Entity('service_subscriptions')
@Index('idx_svc_sub_tenant', ['tenant_id'])
@Index('idx_svc_sub_customer', ['customer_id'])
@Index('idx_svc_sub_status', ['status'])
export class ServiceSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  customer_id: number;

  @Column({ length: 160 })
  title: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monthly_amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 16 })
  iva_percentage: number;

  @ManyToOne(() => FiscalConfiguration, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'fiscal_configuration_id' })
  fiscal_configuration: FiscalConfiguration;

  @Column()
  fiscal_configuration_id: string;

  @ManyToOne(() => BillingBranch, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'billing_branch_id' })
  billing_branch: BillingBranch;

  @Column()
  billing_branch_id: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => ProductUoM, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'product_uom_id' })
  product_uom: ProductUoM;

  @Column()
  product_uom_id: string;

  @Column({ type: 'date' })
  start_month: string;

  @Column({ type: 'date' })
  end_month: string;

  @Column({ type: 'tinyint', default: 1 })
  billing_day: number;

  @Column({ type: 'varchar', length: 20, default: ServiceSubscriptionStatus.Active })
  status: ServiceSubscriptionStatus;

  @Column({ length: 3, default: 'G03' })
  uso_cfdi: string;

  @Column({ length: 2, default: '99' })
  forma_pago: string;

  @Column({ length: 3, default: 'PPD' })
  metodo_pago: string;

  @Column({ length: 3, default: '601' })
  regimen_fiscal_receptor: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => ServiceSubscription, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'renewed_from_id' })
  renewed_from: ServiceSubscription | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  renewed_from_id: string | null;

  @Column()
  created_by: string;

  @OneToMany(() => ServiceSubscriptionPeriod, (period) => period.subscription)
  periods: ServiceSubscriptionPeriod[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
