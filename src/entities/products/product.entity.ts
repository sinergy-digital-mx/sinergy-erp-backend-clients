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
import { Category } from '../categories/category.entity';
import { Subcategory } from '../categories/subcategory.entity';

@Entity('products')
@Index('UQ_products_tenant_sku', ['tenant_id', 'sku'], { unique: true })
@Index('UQ_products_tenant_external_sku', ['tenant_id', 'external_sku'], { unique: true })
@Index('IDX_products_tenant_id', ['tenant_id'])
@Index('IDX_products_sku', ['sku'])
@Index('IDX_products_external_sku', ['external_sku'])
@Index('IDX_products_category_id', ['category_id'])
@Index('IDX_products_subcategory_id', ['subcategory_id'])
@Index('IDX_products_tenant_category', ['tenant_id', 'category_id'])
@Index('IDX_products_tenant_subcategory', ['tenant_id', 'subcategory_id'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column({ length: 255 })
  sku: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  external_sku: string | null;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photo: string | null;

  @Column({ default: true })
  is_active: boolean;

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

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
