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

@Entity('third_party_configs')
@Index(['tenant_id', 'provider'], { unique: true })
export class ThirdPartyConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ name: 'tenant_id' })
  tenant_id: string;

  @Column()
  provider: string; // e.g., 'stripe', 'twilio', 'sendgrid', 'slack'

  @Column()
  name: string; // e.g., 'Production Stripe', 'Development Twilio'

  @Column({ type: 'text' })
  encrypted_api_key: string; // Encrypted API key

  @Column({ nullable: true, type: 'text' })
  encrypted_api_secret: string | null; // Optional encrypted secret

  @Column({ nullable: true, type: 'text' })
  encrypted_webhook_secret: string | null; // Optional encrypted webhook secret

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Additional config like account_id, region, etc.

  @Column({ default: true })
  is_enabled: boolean;

  @Column({ nullable: true })
  last_tested_at: Date;

  @Column({ default: false })
  is_test_mode: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ nullable: true })
  created_by: string; // User ID who created this

  @Column({ nullable: true })
  updated_by: string; // User ID who last updated this
}
