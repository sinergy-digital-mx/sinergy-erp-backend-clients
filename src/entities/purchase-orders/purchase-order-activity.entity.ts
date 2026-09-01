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
import { User } from '../users/user.entity';
import { PurchaseOrderBatch } from './purchase-order-batch.entity';

export type PurchaseOrderActivityChange = {
  field: string;
  field_label: string;
  from: string | null;
  to: string | null;
};

@Entity('inv_s_purchase_order_activities')
@Index('idx_po_activity_tenant', ['tenant_id'])
@Index('idx_po_activity_order', ['purchase_order_batch_id'])
@Index('idx_po_activity_occurred', ['purchase_order_batch_id', 'occurred_at'])
export class PurchaseOrderActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ length: 36 })
  tenant_id: string;

  @ManyToOne(() => PurchaseOrderBatch, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'purchase_order_batch_id' })
  purchase_order_batch: PurchaseOrderBatch;

  @Column({ length: 36 })
  purchase_order_batch_id: string;

  @Column({ length: 50 })
  type: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User | null;

  @Column({ length: 36, nullable: true })
  actor_id: string | null;

  @Column({ type: 'timestamp' })
  occurred_at: Date;

  @Column({ type: 'json', nullable: true })
  changes: PurchaseOrderActivityChange[] | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
