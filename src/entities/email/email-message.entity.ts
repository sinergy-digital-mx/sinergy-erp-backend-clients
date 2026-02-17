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
import { EmailThread } from './email-thread.entity';

@Entity('email_messages')
@Index(['thread_id', 'created_at'])
@Index(['tenant_id', 'external_id'])
export class EmailMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ name: 'tenant_id' })
  tenant_id: string;

  @ManyToOne(() => EmailThread, (thread) => thread.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'thread_id' })
  thread: EmailThread;

  @Column()
  thread_id: string;

  @Column()
  message_id: string; // Unique email ID

  @Column({ nullable: true })
  in_reply_to: string; // Message-ID of parent email

  @Column()
  from_email: string;

  @Column()
  to_email: string;

  @Column({ nullable: true })
  cc: string;

  @Column({ nullable: true })
  bcc: string;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'text', nullable: true })
  body_html: string;

  @Column({ default: 'outbound' })
  direction: 'inbound' | 'outbound';

  @Column({ default: 'pending' })
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'received';

  @Column({ default: 'gmail' })
  external_provider: string;

  @Column({ nullable: true })
  external_id: string; // ID from Gmail, Outlook, etc.

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  received_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date;
}
