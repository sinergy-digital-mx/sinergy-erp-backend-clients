import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { PurchaseOrderBatch } from './purchase-order-batch.entity';
import { PurchaseOrderDocumentType } from './purchase-order-document-type.entity';
import { PurchaseOrderDocumentLanguage } from './purchase-order-document-language.enum';
import { User } from '../users/user.entity';

@Entity('inv_s_purchase_order_documents')
@Index('idx_po_batch_id', ['purchase_order_batch_id'])
@Index('idx_doc_type_id', ['document_type_id'])
export class PurchaseOrderDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrderBatch, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'purchase_order_batch_id' })
  purchase_order_batch: PurchaseOrderBatch;

  @Column()
  purchase_order_batch_id: string;

  @ManyToOne(() => PurchaseOrderDocumentType, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'document_type_id' })
  document_type: PurchaseOrderDocumentType;

  @Column()
  document_type_id: number;

  @Column({ length: 255 })
  file_name: string;

  @Column({ length: 500 })
  file_path: string;

  @Column({ type: 'bigint', nullable: true })
  file_size: number;

  @Column({ length: 100, nullable: true })
  mime_type: string;

  @Column({
    type: 'enum',
    enum: PurchaseOrderDocumentLanguage,
    default: PurchaseOrderDocumentLanguage.ES,
  })
  document_language: PurchaseOrderDocumentLanguage;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @Column()
  uploaded_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
