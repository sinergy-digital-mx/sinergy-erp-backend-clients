import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SalesOrder } from './sales-order.entity';
import { Product } from '../products/product.entity';
import { ProductUoM } from '../products/product-uom.entity';
import { ProductDiscount } from '../products/product-discount.entity';
import { UoMCatalog } from '../uom-catalog/uom-catalog.entity';
import { SalesOrderBatchAllocation } from './sales-order-batch-allocation.entity';

@Entity('inv_s_sales_order_details')
@Index('idx_so_detail_order', ['sales_order_id'])
@Index('idx_so_detail_product', ['product_id'])
export class SalesOrderDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SalesOrder, (so) => so.line_items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrder;

  @Column()
  sales_order_id: string;

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

  /** Quantity requested in the order (in product UOM) */
  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number;

  /** Quantity converted to base UOM for inventory deduction */
  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantity_base_uom: number;

  @ManyToOne(() => UoMCatalog, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'base_uom_id' })
  base_uom: UoMCatalog;

  @Column({ nullable: true })
  base_uom_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount_unit: number;

  @ManyToOne(() => ProductDiscount, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_discount_id' })
  product_discount: ProductDiscount | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  product_discount_id: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  iva_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  iva_unit: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  ieps_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ieps_unit: number;

  @Column()
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ nullable: true })
  updated_by: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => SalesOrderBatchAllocation, (a) => a.sales_order_detail)
  batch_allocations: SalesOrderBatchAllocation[];
}
