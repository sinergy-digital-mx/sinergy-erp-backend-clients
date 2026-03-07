import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';
import { Vendor } from '../vendor/vendor.entity';
import { Product } from './product.entity';
import { UoM } from './uom.entity';

@Entity('vendor_product_prices')
@Index('vendor_index', ['vendor_id'])
@Index('product_index', ['product_id'])
@Index('uom_index', ['uom_id'])
@Index('vendor_product_uom_index', ['vendor_id', 'product_id', 'uom_id'], {
  unique: true,
})
@Check(`"price" >= 0`)
export class VendorProductPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column()
  vendor_id: string;

  @ManyToOne(() => Product, (product) => product.vendor_prices, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => UoM, (uom) => uom.vendor_prices, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'uom_id' })
  uom: UoM;

  @Column()
  uom_id: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, nullable: false })
  price: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
