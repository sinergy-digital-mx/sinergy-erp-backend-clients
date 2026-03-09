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
import { ProductPrice } from './product-price.entity';

@Entity('price_lists')
@Index('price_lists_tenant_idx', ['tenant_id'])
@Index('price_lists_tenant_name_idx', ['tenant_id', 'name'], { unique: true })
export class PriceList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  is_default: boolean;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'date', nullable: true })
  valid_from: Date | null;

  @Column({ type: 'date', nullable: true })
  valid_to: Date | null;

  @OneToMany(() => ProductPrice, (price) => price.price_list, { cascade: true })
  product_prices: ProductPrice[];

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
