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
import { PurchaseOrderBatch } from './purchase-order-batch.entity';
import { Product } from '../products/product.entity';
import { ProductUoM } from '../products/product-uom.entity';
import { UoMCatalog } from '../uom-catalog/uom-catalog.entity';

@Entity('inv_s_purchase_order_batch_detail')
@Index('idx_purchase_order', ['purchase_order_batch_id'])
@Index('idx_product', ['product_id'])
@Index('idx_received_product', ['received_original_product_id'])
export class PurchaseOrderBatchDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrderBatch, (batch) => batch.line_items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'purchase_order_batch_id' })
  purchase_order_batch: PurchaseOrderBatch;

  @Column()
  purchase_order_batch_id: string;

  // Requested (original order)
  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => ProductUoM, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'product_uom_id' })
  product_uom: ProductUoM;

  @Column()
  product_uom_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number;

  /** Costo unitario sin impuestos. Hasta 4 decimales. */
  @Column({ type: 'decimal', precision: 16, scale: 4 })
  unit_total: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  iva_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  iva_unit: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  ieps_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ieps_unit: number;

  /** qty × unit_total. Sin IVA ni IEPS. */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  line_subtotal: number;

  /** IVA de la línea (no por unidad). */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  line_iva: number;

  /** IEPS de la línea (no por unidad). */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  line_ieps: number;

  /** line_subtotal + line_iva + line_ieps. */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  line_total: number;

  // Received Original (what actually arrived) - original units
  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'received_original_product_id' })
  received_product: Product;

  @Column({ nullable: true })
  received_original_product_id: string;

  @ManyToOne(() => UoMCatalog, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'received_original_uom_id' })
  received_uom: UoMCatalog;

  @Column({ nullable: true })
  received_original_uom_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  received_original_quantity: number;

  @Column({ type: 'decimal', precision: 16, scale: 4, nullable: true })
  received_original_unit_total: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  received_original_iva_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  received_original_iva_unit: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  received_original_ieps_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  received_original_ieps_unit: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  received_line_subtotal: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  received_line_iva: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  received_line_ieps: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  received_line_total: number | null;

  // Received Converted (converted to base units for inventory)
  @ManyToOne(() => UoMCatalog, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'received_converted_uom_id' })
  converted_uom: UoMCatalog;

  @Column({ nullable: true })
  received_converted_uom_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  received_converted_quantity: number;

  @Column()
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ nullable: true })
  updated_by: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
