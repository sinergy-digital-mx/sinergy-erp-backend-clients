import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';

@Entity('whatsapp_messages')
@Index('idx_whatsapp_messages_tenant_created', ['tenant_id', 'created_at'])
@Index('idx_whatsapp_messages_tenant_status', ['tenant_id', 'status'])
@Index('idx_whatsapp_messages_waha_id', ['waha_message_id'])
@Index('idx_whatsapp_messages_reference', ['tenant_id', 'reference_type', 'reference_id'])
export class WhatsappMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 80 })
  session_name: string;

  @Column({ type: 'varchar', length: 80 })
  to_phone: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  chat_id: string | null;

  @Column({ type: 'varchar', length: 16, default: 'text' })
  type: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  file_name: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  file_mimetype: string | null;

  @Column({ type: 'varchar', length: 16, default: 'queued' })
  status: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  error_message: string | null;

  @Column({ type: 'varchar', length: 190, nullable: true })
  waha_message_id: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  reference_type: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  reference_id: string | null;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date | null;

  @Column({ type: 'varchar', length: 36 })
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
