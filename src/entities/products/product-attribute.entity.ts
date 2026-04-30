import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ProductAttributeValue } from './product-attribute-value.entity';

@Entity('product_attributes')
@Index('UQ_product_attributes_tenant_name', ['tenant_id', 'name'], { unique: true })
@Index('IDX_product_attributes_tenant_id', ['tenant_id'])
@Index('IDX_product_attributes_is_active', ['is_active'])
export class ProductAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => ProductAttributeValue, (value) => value.attribute)
  values: ProductAttributeValue[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
