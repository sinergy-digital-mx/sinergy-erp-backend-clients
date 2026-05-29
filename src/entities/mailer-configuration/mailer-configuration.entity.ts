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

export type MailerConfigurationVendor = 'resend' | 'sendgrid' | 'aws_ses' | 'smtp';

export interface StoredMailerVendorConfig {
  [key: string]: unknown;
}

@Entity('mailer_configurations')
@Index('IDX_mailer_configurations_tenant_is_active', ['tenant_id', 'is_active'])
@Index('IDX_mailer_configurations_tenant_is_fallback', ['tenant_id', 'is_fallback'])
@Index('IDX_mailer_configurations_created_at', ['created_at'])
@Index('IDX_mailer_configurations_tenant_name', ['tenant_id', 'name'], { unique: true })
export class MailerConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: ['resend', 'sendgrid', 'aws_ses', 'smtp'],
  })
  vendor: MailerConfigurationVendor;

  @Column({ type: 'json' })
  vendor_config: StoredMailerVendorConfig;

  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_fallback: boolean;

  @Column({ type: 'boolean', default: true })
  is_valid: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'varchar', length: 36 })
  created_by: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'varchar', length: 36 })
  updated_by: string;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  deleted_by: string | null;

  @Column({ type: 'json', nullable: true })
  last_test_result: Record<string, unknown> | null;

  @Column({ type: 'timestamp', nullable: true })
  last_test_timestamp: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_used_timestamp: Date | null;
}
