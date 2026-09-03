import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Quotation } from './quotation.entity';
import { QuotationDocumentType } from './quotation-document-type.entity';
import { DocumentLanguage } from '../../common/enums/document-language.enum';
import { User } from '../users/user.entity';

@Entity('inv_s_quotation_documents')
@Index('idx_qt_doc_quotation_id', ['quotation_id'])
@Index('idx_qt_doc_type_id', ['document_type_id'])
export class QuotationDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Quotation, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'quotation_id' })
  quotation: Quotation;

  @Column()
  quotation_id: string;

  @ManyToOne(() => QuotationDocumentType, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'document_type_id' })
  document_type: QuotationDocumentType;

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
