import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProductAttribute } from './product-attribute.entity';

@Entity('product_attribute_values')
@Index('UQ_product_attribute_values_attribute_value', ['attribute_id', 'value'], { unique: true })
@Index('IDX_product_attribute_values_attribute_id', ['attribute_id'])
@Index('IDX_product_attribute_values_is_active', ['is_active'])
export class ProductAttributeValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductAttribute, (attribute) => attribute.values, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'attribute_id' })
  attribute: ProductAttribute;

  @Column()
  attribute_id: string;

  @Column({ type: 'varchar', length: 100 })
  value: string;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
