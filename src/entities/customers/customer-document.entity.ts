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
import { Customer } from './customer.entity';
import { DocumentType } from './document-type.entity';
import { RBACTenant } from '../rbac/tenant.entity';

@Entity('customer_documents')
@Index('tenant_index', ['tenant_id'])
@Index('customer_index', ['customer_id'])
export class CustomerDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  customer_id: number;

  @ManyToOne(() => DocumentType, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'document_type_id' })
  document_type: DocumentType;

  @Column()
  document_type_id: string;

  @Column({ length: 255 })
  file_name: string; // Original filename

  @Column({ length: 500 })
  s3_key: string; // S3 path: {tenant_id}/{customer_id}/{document_type}/{uuid}-{filename}

  @Column({ length: 100 })
  mime_type: string; // application/pdf, image/jpeg, etc.

  @Column({ type: 'bigint' })
  file_size: number; // bytes

  @Column({ type: 'date', nullable: true })
  expiration_date: Date | null; // Para documentos que expiran (INE, licencia, etc.)

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Info adicional

  @Column({ nullable: true })
  uploaded_by: string; // User ID que subió el documento

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
