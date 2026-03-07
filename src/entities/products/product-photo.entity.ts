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
import { RBACTenant } from '../rbac/tenant.entity';

@Entity('product_photos')
@Index('tenant_index', ['tenant_id'])
@Index('product_index', ['product_id'])
export class ProductPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Product, (product) => product.photos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @Column({ length: 255 })
  file_name: string; // Original filename

  @Column({ length: 500 })
  s3_key: string; // S3 path: {tenant_id}/products/{product_id}/{uuid}-{filename}

  @Column({ length: 100 })
  mime_type: string; // image/png, image/jpeg, etc.

  @Column({ type: 'bigint' })
  file_size: number; // bytes

  @Column({ type: 'int', default: 0 })
  display_order: number; // Para ordenar fotos en el catálogo

  @Column({ type: 'boolean', default: false })
  is_primary: boolean; // Foto principal del producto

  @Column({ type: 'text', nullable: true })
  alt_text: string; // Texto alternativo para accesibilidad

  @Column({ nullable: true })
  uploaded_by: string; // User ID que subió la foto

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
