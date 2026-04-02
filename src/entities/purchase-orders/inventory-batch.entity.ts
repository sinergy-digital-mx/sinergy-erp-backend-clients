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
import { Warehouse } from '../warehouse/warehouse.entity';
import { Product } from '../products/product.entity';
import { UoMCatalog } from '../uom-catalog/uom-catalog.entity';
import { PurchaseOrderBatch } from './purchase-order-batch.entity';
import { PurchaseOrderBatchDetail } from './purchase-order-batch-detail.entity';

@Entity('inv_s_batches')
@Index('idx_tenant', ['tenant_id'])
@Index('idx_warehouse', ['warehouse_id'])
@Index('idx_product', ['product_id'])
@Index('idx_batch_number', ['batch_number'])
@Index('idx_purchase_order', ['purchase_order_batch_id'])
@Index('uq_batch_number', ['tenant_id', 'batch_number'], { unique: true })
export class InventoryBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column({ length: 50 })
  batch_number: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => UoMCatalog, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'uom_id' })
  uom: UoMCatalog;

  @Column()
  uom_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number;

  @ManyToOne(() => PurchaseOrderBatch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'purchase_order_batch_id' })
  purchase_order: PurchaseOrderBatch;

  @Column({ nullable: true })
  purchase_order_batch_id: string;

  @ManyToOne(() => PurchaseOrderBatchDetail, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'purchase_order_detail_id' })
  purchase_order_detail: PurchaseOrderBatchDetail;

  @Column({ nullable: true })
  purchase_order_detail_id: string;

  @Column()
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
