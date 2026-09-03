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
import { Quotation } from './quotation.entity';

@Entity('inv_s_quotation_emails')
@Index('idx_qt_email_quotation', ['quotation_id'])
@Index('idx_qt_email_tenant', ['tenant_id'])
export class QuotationEmail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Quotation, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'quotation_id' })
  quotation: Quotation;

  @Column()
  quotation_id: string;

  @Column({ length: 255 })
  to_email: string;

  @Column({ type: 'json', nullable: true })
  cc: string[] | null;

  @Column({ type: 'json', nullable: true })
  bcc: string[] | null;

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
