import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceSubscription } from './service-subscription.entity';
import { ServiceSubscriptionPeriodStatus } from './service-subscription-period-status.enum';
import { SalesOrder } from '../sales-orders/sales-order.entity';

@Entity('service_subscription_periods')
@Index('idx_svc_period_subscription', ['subscription_id'])
@Index('uq_svc_period_month', ['subscription_id', 'period_month'], { unique: true })
@Index('uq_svc_period_order', ['sales_order_id'], { unique: true })
export class ServiceSubscriptionPeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @ManyToOne(() => ServiceSubscription, (subscription) => subscription.periods, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'subscription_id' })
  subscription: ServiceSubscription;

  @Column()
  subscription_id: string;

  @Column({ type: 'date' })
  period_month: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 20, default: ServiceSubscriptionPeriodStatus.Pending })
  status: ServiceSubscriptionPeriodStatus;

  @ManyToOne(() => SalesOrder, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrder | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  sales_order_id: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  electronic_invoice_id: string | null;

  @Column({ type: 'boolean', default: false })
  linked_manually: boolean;

  @Column({ type: 'text', nullable: true })
  invoice_error: string | null;

  @Column({ type: 'timestamp', nullable: true })
  generated_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
