import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { SalesOrder } from '../sales-orders/sales-order.entity';
import { PosDailyShift } from './pos-daily-shift.entity';
import { Customer } from '../customers/customer.entity';
import { User } from '../users/user.entity';
import { PosSalePaymentMethod } from './pos-sale-payment-method.enum';

@Entity('pos_sale_collections')
@Index('uq_pos_sale_collection_order', ['sales_order_id'], { unique: true })
@Index('idx_pos_sale_collection_shift', ['pos_daily_shift_id'])
export class PosSaleCollection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  sales_order_id: string;

  @ManyToOne(() => SalesOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrder;

  @Column()
  pos_daily_shift_id: string;

  @ManyToOne(() => PosDailyShift, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pos_daily_shift_id' })
  pos_daily_shift: PosDailyShift;

  @Column()
  customer_id: number;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({
    type: 'enum',
    enum: PosSalePaymentMethod,
  })
  payment_method: PosSalePaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  order_total_mxn: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount_cash_mxn: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount_cash_usd: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  usd_exchange_rate: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount_transfer_mxn: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  transfer_reference: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount_card_mxn: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  card_reference: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  received_cash_mxn: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  received_cash_usd: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  change_cash_mxn: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  change_cash_usd: number;

  @Column()
  collected_by_user_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'collected_by_user_id' })
  collected_by_user: User;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
