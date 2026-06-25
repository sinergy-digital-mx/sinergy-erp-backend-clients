import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { SalesOrder } from './sales-order.entity';
import { SalesOrderDocumentType } from './sales-order-document-type.entity';
import { DocumentLanguage } from '../../common/enums/document-language.enum';
import { User } from '../users/user.entity';

@Entity('inv_s_sales_order_documents')
@Index('idx_so_doc_order_id', ['sales_order_id'])
@Index('idx_so_doc_type_id', ['document_type_id'])
export class SalesOrderDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SalesOrder, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrder;

  @Column()
  sales_order_id: string;

  @ManyToOne(() => SalesOrderDocumentType, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'document_type_id' })
  document_type: SalesOrderDocumentType;

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
    enum: DocumentLanguage,
    default: DocumentLanguage.ES,
  })
  document_language: DocumentLanguage;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @Column()
  uploaded_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
