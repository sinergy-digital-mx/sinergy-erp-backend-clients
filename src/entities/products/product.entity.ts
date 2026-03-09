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
import { RBACTenant } from '../rbac/tenant.entity';
import { Category } from '../categories/category.entity';
import { Subcategory } from '../categories/subcategory.entity';
import { UoM } from './uom.entity';
import { UoMRelationship } from './uom-relationship.entity';
import { VendorProductPrice } from './vendor-product-price.entity';
import { ProductPhoto } from './product-photo.entity';
import { UoMCatalog } from './uom-catalog.entity';
import { ProductPrice } from './product-price.entity';

@Entity('products')
@Index('tenant_sku_index', ['tenant_id', 'sku'], { unique: true })
@Index('tenant_index', ['tenant_id'])
@Index('sku_index', ['sku'])
@Index('category_index', ['category_id'])
@Index('subcategory_index', ['subcategory_id'])
@Index('tenant_category_index', ['tenant_id', 'category_id'])
@Index('tenant_subcategory_index', ['tenant_id', 'subcategory_id'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ nullable: true })
  category_id: string | null;

  @ManyToOne(() => Subcategory, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'subcategory_id' })
  subcategory: Subcategory | null;

  @Column({ nullable: true })
  subcategory_id: string | null;

  @Column({ length: 255, nullable: false })
  sku: string;

  @Column({ length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => UoMCatalog, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'base_uom_id' })
  base_uom: UoMCatalog | null;

  @Column({ nullable: true })
  base_uom_id: string | null;

  @OneToMany(() => UoM, (uom) => uom.product, { cascade: true })
  uoms: UoM[];

  @OneToMany(() => UoMRelationship, (rel) => rel.product, { cascade: true })
  uom_relationships: UoMRelationship[];

  @OneToMany(() => VendorProductPrice, (price) => price.product, { cascade: true })
  vendor_prices: VendorProductPrice[];

  @OneToMany(() => ProductPhoto, (photo) => photo.product, { cascade: true })
  photos: ProductPhoto[];

  @OneToMany(() => ProductPrice, (price) => price.product, { cascade: true })
  prices: ProductPrice[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
