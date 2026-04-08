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
import { Payment } from './payment.entity';
import { RBACTenant } from '../rbac/tenant.entity';

@Entity('payment_documents')
@Index('tenant_index', ['tenant_id'])
@Index('payment_index', ['payment_id'])
@Index('document_type_index', ['document_type'])
export class PaymentDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column()
  payment_id: string;

  @Column({
    type: 'enum',
    enum: ['comprobante_transferencia', 'foto_deposito', 'recibo', 'factura', 'otro'],
    default: 'comprobante_transferencia',
  })
  document_type: string; // Tipo de documento

  @Column({ length: 255 })
  file_name: string; // Nombre original del archivo

  @Column({ length: 500 })
  s3_key: string; // Ruta S3: {tenant_id}/payments/{payment_id}/{uuid}-{filename}

  @Column({ length: 100 })
  mime_type: string; // application/pdf, image/jpeg, image/png, etc.

  @Column({ type: 'bigint' })
  file_size: number; // Tamaño en bytes

  @Column({ type: 'text', nullable: true })
  notes: string; // Notas adicionales sobre el documento

  @Column({ nullable: true })
  uploaded_by: string; // ID del usuario que subió el documento

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Información adicional

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
