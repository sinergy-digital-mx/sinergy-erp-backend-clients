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
import { PurchaseOrder } from './purchase-order.entity';

@Entity('payments')
@Index('purchase_order_index', ['purchase_order_id'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.payments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'purchase_order_id' })
  purchase_order: PurchaseOrder;

  @Column()
  purchase_order_id: string;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  payment_amount: number;

  @Column()
  payment_method: string;

  @Column({ nullable: true })
  reference_number: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
