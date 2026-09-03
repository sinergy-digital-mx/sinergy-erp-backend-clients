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
import { PurchaseOrderBatch } from './purchase-order-batch.entity';
import { User } from '../users/user.entity';

/** Gasto agregado libre (flete, honorarios, o cualquier concepto nuevo). */
@Entity('inv_s_purchase_order_landed_cost_line')
@Index('idx_po_landed_cost_tenant', ['tenant_id'])
@Index('idx_po_landed_cost_po_id', ['purchase_order_batch_id'])
export class PurchaseOrderLandedCostLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => PurchaseOrderBatch, (po) => po.landed_cost_lines, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'purchase_order_batch_id' })
  purchase_order_batch: PurchaseOrderBatch;

  @Column()
  purchase_order_batch_id: string;

  @Column({ type: 'varchar', length: 120 })
  concept: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['MXN', 'USD'],
    default: 'MXN',
  })
  currency: 'MXN' | 'USD';

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column()
  created_by: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  updated_by: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
