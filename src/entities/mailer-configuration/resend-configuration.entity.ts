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

/**
 * ResendConfiguration Entity
 * Represents a Resend email service provider configuration for a specific tenant
 * Stores encrypted API keys and configuration metadata
 */
@Entity('resend_configurations')
@Index('idx_tenant_id_is_active', ['tenant_id', 'is_active'])
@Index('idx_created_at', ['created_at'])
@Index('idx_tenant_id_name', ['tenant_id', 'name'], { unique: true })
export class ResendConfiguration {
  /**
   * Unique identifier for the Resend configuration
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Foreign key to the tenant this configuration belongs to
   */
  @Column({ type: 'uuid' })
  tenant_id: string;

  /**
   * Relationship to the tenant
   */
  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  /**
   * Name of the Resend configuration (unique per tenant)
   */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /**
   * Encrypted Resend API key
   */
  @Column({ type: 'text' })
  api_key_encrypted: string;

  /**
   * Encryption IV for the API key
   */
  @Column({ type: 'varchar', length: 255 })
  api_key_iv: string;

  /**
   * Whether this is the active configuration for the tenant
   */
  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  /**
   * Whether this configuration has passed validation
   */
  @Column({ type: 'boolean', default: true })
  is_valid: boolean;

  /**
   * Timestamp when the configuration was created
   */
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  /**
   * User ID who created the configuration
   */
  @Column({ type: 'uuid' })
  created_by: string;

  /**
   * Timestamp when the configuration was last updated
   */
  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  /**
   * User ID who last updated the configuration
   */
  @Column({ type: 'uuid' })
  updated_by: string;

  /**
   * Timestamp when the configuration was deleted (soft delete)
   */
  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  /**
   * User ID who deleted the configuration
   */
  @Column({ type: 'uuid', nullable: true })
  deleted_by: string | null;

  /**
   * Timestamp of the last time this configuration was used to send an email
   */
  @Column({ type: 'timestamp', nullable: true })
  last_used_timestamp: Date | null;
}
