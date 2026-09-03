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
import { PriceList } from './price-list.entity';
import { ProductUoM } from './product-uom.entity';

@Entity('product_prices')
@Index('product_price_list_uom_unique', ['product_id', 'price_list_id', 'product_uom_id'], { unique: true })
@Index('product_index', ['product_id'])
@Index('price_list_index', ['price_list_id'])
@Index('product_uom_index', ['product_uom_id'])
export class ProductPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => PriceList, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'price_list_id' })
  price_list: PriceList;

  @Column()
  price_list_id: string;

  @ManyToOne(() => ProductUoM, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_uom_id' })
  product_uom: ProductUoM;

  @Column()
  product_uom_id: string;

  /** Precio unitario de lista. Hasta 4 decimales (p. ej. 2.150). */
  @Column({ type: 'decimal', precision: 16, scale: 4 })
  price: number;

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
