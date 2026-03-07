import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Product } from './product.entity';
import { UoMCatalog } from './uom-catalog.entity';
import { UoMRelationship } from './uom-relationship.entity';
import { VendorProductPrice } from './vendor-product-price.entity';

@Entity('uoms')
@Index('product_catalog_index', ['product_id', 'uom_catalog_id'], { unique: true })
@Index('product_index', ['product_id'])
export class UoM {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.uoms, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => UoMCatalog, (catalog) => catalog.uoms, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'uom_catalog_id' })
  catalog: UoMCatalog | null;

  @Column({ nullable: true })
  uom_catalog_id: string | null;

  @Column({ length: 100, nullable: false })
  code: string;

  @Column({ length: 255, nullable: false })
  name: string;

  @OneToMany(() => UoMRelationship, (rel) => rel.source_uom)
  source_relationships: UoMRelationship[];

  @OneToMany(() => UoMRelationship, (rel) => rel.target_uom)
  target_relationships: UoMRelationship[];

  @OneToMany(() => VendorProductPrice, (price) => price.uom)
  vendor_prices: VendorProductPrice[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
