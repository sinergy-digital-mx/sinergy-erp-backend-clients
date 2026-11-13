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
import { PosDailyShift } from './pos-daily-shift.entity';
import { PosSalePaymentMethod } from './pos-sale-payment-method.enum';

@Entity('advance_shift_payments')
@Index('uq_advance_shift_payment_invoice', ['electronic_invoice_id'], { unique: true })
@Index('idx_advance_shift_payment_shift', ['pos_daily_shift_id'])
@Index('idx_advance_shift_payment_quotation', ['quotation_id'])
export class AdvanceShiftPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ type: 'varchar', length: 36, nullable: true })
  quotation_id: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  sales_order_id: string | null;

  @Column({ type: 'varchar', length: 36 })
  electronic_invoice_id: string;

  @Column()
  pos_daily_shift_id: string;

  @ManyToOne(() => PosDailyShift, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pos_daily_shift_id' })
  pos_daily_shift: PosDailyShift;

  @Column({ type: 'varchar', length: 20 })
  payment_method: PosSalePaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount_mxn: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount_cash_mxn: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount_transfer_mxn: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount_card_mxn: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount_check_mxn: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  transfer_payer_name: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  transfer_payer_business_name: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  card_payer_name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  card_payer_phone: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  check_payer_name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  check_payer_phone: string | null;

  @Column({ type: 'varchar', length: 40 })
  document_folio: string;

  @Column()
  collected_by_user_id: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  sales_order_payment_id: string | null;

  @Column({ type: 'timestamp', nullable: true })
  voided_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
