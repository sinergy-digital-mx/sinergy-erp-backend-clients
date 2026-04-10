import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { SalesOrderDetail } from './sales-order-detail.entity';
import { InventoryBatch } from '../purchase-orders/inventory-batch.entity';

/**
 * Tracks which inventory batches were allocated to each sales order line item.
 * FIFO: batches are consumed oldest-first until the requested quantity is fulfilled.
 *
 * Example: need 15 units, lote A has 10, lote B has 20
 *   → allocation 1: lote A, quantity 10
 *   → allocation 2: lote B, quantity 5
 */
@Entity('inv_s_sales_order_batch_allocations')
@Index('idx_alloc_detail', ['sales_order_detail_id'])
@Index('idx_alloc_batch', ['inventory_batch_id'])
export class SalesOrderBatchAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SalesOrderDetail, (d) => d.batch_allocations, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'sales_order_detail_id' })
  sales_order_detail: SalesOrderDetail;

  @Column()
  sales_order_detail_id: string;

  @ManyToOne(() => InventoryBatch, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'inventory_batch_id' })
  inventory_batch: InventoryBatch;

  @Column()
  inventory_batch_id: string;

  /** Quantity taken from this batch (in base UOM) */
  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity_allocated: number;

  @Column()
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
