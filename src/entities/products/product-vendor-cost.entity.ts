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
import { Product } from './product.entity';
import { Vendor } from '../vendor/vendor.entity';
import { ProductUoM } from './product-uom.entity';

@Entity('product_vendor_costs')
@Index('product_vendor_uom_unique', ['product_id', 'vendor_id', 'product_uom_id'], { unique: true })
@Index('product_index', ['product_id'])
@Index('vendor_index', ['vendor_id'])
@Index('product_uom_index', ['product_uom_id'])
export class ProductVendorCost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column()
  vendor_id: string;

  @ManyToOne(() => ProductUoM, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_uom_id' })
  product_uom: ProductUoM;

  @Column()
  product_uom_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  cost: number;

  /** Moneda del costo de este proveedor + UOM. Una OC no puede mezclar MXN y USD. */
  @Column({
    type: 'enum',
    enum: ['MXN', 'USD'],
    default: 'MXN',
  })
  currency: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  iva_percentage: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  ieps_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  iva_unit_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ieps_unit_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
