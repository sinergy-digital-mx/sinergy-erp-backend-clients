import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { POSOrder } from './pos-order.entity';
import { User } from '../users/user.entity';
import { CashShift } from './cash-shift.entity';

@Entity('pos_payments')
@Index('pos_payments_order_idx', ['pos_order_id'])
@Index('pos_payments_cashier_idx', ['cashier_id'])
@Index('pos_payments_shift_idx', ['cash_shift_id'])
@Index('pos_payments_method_idx', ['payment_method'])
export class POSPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => POSOrder, (order) => order.payments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'pos_order_id' })
  pos_order: POSOrder;

  @Column()
  pos_order_id: string;

  @Column({
    type: 'enum',
    enum: ['cash', 'card', 'transfer', 'mixed'],
  })
  payment_method: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  received_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  change_amount: number;

  @Column({ nullable: true })
  reference: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'cashier_id' })
  cashier: User;

  @Column()
  cashier_id: string;

  @ManyToOne(() => CashShift, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'cash_shift_id' })
  cash_shift: CashShift;

  @Column()
  cash_shift_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
