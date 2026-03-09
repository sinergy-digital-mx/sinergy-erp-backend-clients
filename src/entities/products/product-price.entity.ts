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
import { Product } from './product.entity';
import { PriceList } from './price-list.entity';

@Entity('product_prices')
@Index('product_prices_tenant_idx', ['tenant_id'])
@Index('product_prices_product_idx', ['product_id'])
@Index('product_prices_price_list_idx', ['price_list_id'])
@Index('product_prices_unique_idx', ['product_id', 'price_list_id'], { unique: true })
export class ProductPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => PriceList, (priceList) => priceList.product_prices, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'price_list_id' })
  price_list: PriceList;

  @Column()
  price_list_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount_percentage: number;

  @Column({ type: 'date', nullable: true })
  valid_from: Date | null;

  @Column({ type: 'date', nullable: true })
  valid_to: Date | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
