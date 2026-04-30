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
import { PurchaseOrderBatch } from './purchase-order-batch.entity';
import { User } from '../users/user.entity';

@Entity('inv_s_purchase_order_payments')
@Index('idx_po_payments_tenant', ['tenant_id'])
@Index('idx_po_payments_po_id', ['purchase_order_batch_id'])
@Index('idx_po_payments_date', ['payment_date'])
export class PurchaseOrderPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => PurchaseOrderBatch, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'purchase_order_batch_id' })
  purchase_order_batch: PurchaseOrderBatch;

  @Column()
  purchase_order_batch_id: string;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['MXN', 'USD'],
    default: 'MXN',
  })
  currency: string;

  @Column({ length: 100 })
  payment_method: string;

  @Column({ length: 100, nullable: true })
  reference_number: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column()
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
