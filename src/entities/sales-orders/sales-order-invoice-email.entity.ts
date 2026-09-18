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
import { User } from '../users/user.entity';
import { SalesOrder } from './sales-order.entity';

@Entity('inv_s_sales_order_invoice_emails')
@Index('idx_so_invoice_email_order', ['sales_order_id'])
@Index('idx_so_invoice_email_invoice', ['invoice_id'])
@Index('idx_so_invoice_email_tenant', ['tenant_id'])
export class SalesOrderInvoiceEmail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => SalesOrder, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrder;

  @Column()
  sales_order_id: string;

  @Column({ type: 'varchar', length: 36 })
  invoice_id: string;

  @Column({ length: 255 })
  to_email: string;

  @Column({ type: 'json', nullable: true })
  cc: string[] | null;

  @Column({ length: 255 })
  subject: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sent_by' })
  sender: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  sent_by: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  sent_at: Date;
}
