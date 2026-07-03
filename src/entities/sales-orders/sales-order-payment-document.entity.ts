import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { SalesOrderPayment } from './sales-order-payment.entity';
import { User } from '../users/user.entity';

@Entity('inv_s_sales_order_payment_documents')
@Index('idx_so_pay_doc_tenant', ['tenant_id'])
@Index('idx_so_pay_doc_payment', ['payment_id'])
export class SalesOrderPaymentDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => SalesOrderPayment, (payment) => payment.documents, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'payment_id' })
  payment: SalesOrderPayment;

  @Column()
  payment_id: string;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 500 })
  s3_key: string;

  @Column({ type: 'varchar', length: 100 })
  mime_type: string;

  @Column({ type: 'bigint' })
  file_size: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @Column({ type: 'varchar', length: 36, nullable: true })
  uploaded_by: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
