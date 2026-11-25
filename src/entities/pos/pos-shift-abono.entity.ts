import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { PosSalePaymentMethod } from './pos-sale-payment-method.enum';

/** Abono de caja a una orden con saldo. No es único por orden: puede haber varios. */
@Entity('pos_shift_abonos')
@Index('idx_pos_shift_abono_shift', ['pos_daily_shift_id'])
@Index('idx_pos_shift_abono_order', ['sales_order_id'])
export class PosShiftAbono {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column({ type: 'varchar', length: 36 })
  sales_order_id: string;

  @Column({ type: 'varchar', length: 36 })
  pos_daily_shift_id: string;

  @Column({ type: 'varchar', length: 36 })
  sales_order_payment_id: string;

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
  reference_number: string | null;

  @Column()
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
