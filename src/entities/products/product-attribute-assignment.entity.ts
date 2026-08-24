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
import { ProductAttributeValue } from './product-attribute-value.entity';

@Entity('product_attribute_assignments')
@Index('UQ_product_attribute_assignments_product_value', ['product_id', 'attribute_value_id'], {
  unique: true,
})
@Index('IDX_product_attribute_assignments_product_id', ['product_id'])
@Index('IDX_product_attribute_assignments_attribute_value_id', ['attribute_value_id'])
export class ProductAttributeAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => ProductAttributeValue, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'attribute_value_id' })
  attribute_value: ProductAttributeValue;

  @Column()
  attribute_value_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
