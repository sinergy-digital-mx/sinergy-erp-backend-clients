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

@Entity('gps_tracking_configurations')
@Index('idx_gps_tracking_configurations_tenant', ['tenant_id'])
@Index('idx_gps_tracking_configurations_tenant_active', ['tenant_id', 'is_active'])
export class GpsTrackingConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  username: string;

  @Column({ type: 'text' })
  encrypted_password: string;

  @Column({ type: 'varchar', length: 64 })
  password_iv: string;

  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_valid: boolean;

  @Column({ type: 'json', nullable: true })
  last_test_result: Record<string, unknown> | null;

  @Column({ type: 'timestamp', nullable: true })
  last_test_at: Date | null;

  @Column({ type: 'varchar', length: 36 })
  created_by: string;

  @Column({ type: 'varchar', length: 36 })
  updated_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
