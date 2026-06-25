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
import { ProductUoM } from './product-uom.entity';

export enum ProductDiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('product_discounts')
@Index('product_discount_product_index', ['product_id'])
@Index('product_discount_uom_index', ['product_uom_id'])
@Index('UQ_product_discounts_product_name', ['product_id', 'name'], { unique: true })
export class ProductDiscount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @Column({ length: 120 })
  name: string;

  @Column({
    type: 'enum',
    enum: ProductDiscountType,
    default: ProductDiscountType.PERCENTAGE,
  })
  discount_type: ProductDiscountType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value: number;

  @ManyToOne(() => ProductUoM, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_uom_id' })
  product_uom: ProductUoM | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  product_uom_id: string | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'date', nullable: true })
  valid_from: Date | null;

  @Column({ type: 'date', nullable: true })
  valid_to: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
