import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
import { Lead } from '../leads/lead.entity';
import { EmailMessage } from './email-message.entity';
import { EntityRegistry } from '../entity-registry/entity-registry.entity';

@Entity('email_threads')
@Index(['tenant_id', 'entity_type_id', 'entity_id'])
@Index(['tenant_id', 'status'])
@Index(['lead_id'])
export class EmailThread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ name: 'tenant_id' })
  tenant_id: string;

  // NEW: Foreign key to EntityRegistry
  @ManyToOne(() => EntityRegistry, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'entity_type_id' })
  entityType: EntityRegistry;

  @Column()
  entity_type_id: number;

  // entity_id: UUID of the specific entity instance
  @Column()
  entity_id: string;

  // COMPUTED: Derived from entityType relationship
  get entity_type(): string | null {
    return this.entityType?.code || null;
  }

  @ManyToOne(() => Lead, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ nullable: true })
  lead_id: number;

  @Column()
  subject: string;

  @Column()
  email_from: string;

  @Column()
  email_to: string;

  @Column({ default: 'draft' })
  status: 'draft' | 'sent' | 'replied' | 'closed' | 'archived';

  @Column({ type: 'timestamp', nullable: true })
  last_message_at: Date | null;

  @Column({ default: 0 })
  message_count: number;

  @Column({ default: false })
  is_read: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @Column({ nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => EmailMessage, (message) => message.thread)
  messages: EmailMessage[];
}
