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
import { PurchaseOrder } from './purchase-order.entity';

@Entity('documents')
@Index('purchase_order_index', ['purchase_order_id'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.documents, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'purchase_order_id' })
  purchase_order: PurchaseOrder;

  @Column()
  purchase_order_id: string;

  @Column()
  filename: string;

  @Column()
  file_type: string;

  @Column()
  s3_key: string;

  @Column()
  s3_url: string;

  @Column()
  uploader_id: string;

  @Column({ type: 'bigint' })
  file_size: number;

  @CreateDateColumn({ type: 'timestamp' })
  upload_date: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
