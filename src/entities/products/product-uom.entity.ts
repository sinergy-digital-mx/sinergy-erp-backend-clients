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
import { UoMCatalog } from '../uom-catalog/uom-catalog.entity';

@Entity('product_uoms')
@Index('product_uom_unique', ['product_id', 'uom_catalog_id'], { unique: true })
@Index('product_index', ['product_id'])
@Index('uom_catalog_index', ['uom_catalog_id'])
export class ProductUoM {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => UoMCatalog, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'uom_catalog_id' })
  uom: UoMCatalog;

  @Column()
  uom_catalog_id: string;

  @Column({ type: 'int', default: 1 })
  factor: number;

  @Column({ default: false })
  is_base: boolean;

  @ManyToOne(() => UoMCatalog, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parent_uom_id' })
  parent_uom: UoMCatalog | null;

  @Column({ nullable: true })
  parent_uom_id: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
