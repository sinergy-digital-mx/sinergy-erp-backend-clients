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
import { Product } from './product.entity';
import { UoM } from './uom.entity';

@Entity('uom_relationships')
@Index('product_index', ['product_id'])
@Index('product_source_target_index', ['product_id', 'source_uom_id', 'target_uom_id'], {
  unique: true,
})
@Check(`"conversion_factor" > 0`)
@Check(`"source_uom_id" != "target_uom_id"`)
export class UoMRelationship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.uom_relationships, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => UoM, (uom) => uom.source_relationships, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'source_uom_id' })
  source_uom: UoM;

  @Column()
  source_uom_id: string;

  @ManyToOne(() => UoM, (uom) => uom.target_relationships, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'target_uom_id' })
  target_uom: UoM;

  @Column()
  target_uom_id: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, nullable: false })
  conversion_factor: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
