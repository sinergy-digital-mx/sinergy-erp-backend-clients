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
import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';

@Entity('inv_s_sales_order_invoice_email_templates')
@Index('uq_so_invoice_email_template_tenant', ['tenant_id'], { unique: true })
export class SalesOrderInvoiceEmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column({ length: 255 })
  subject: string;

  @Column({ type: 'longtext' })
  body_html: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  updated_by: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
