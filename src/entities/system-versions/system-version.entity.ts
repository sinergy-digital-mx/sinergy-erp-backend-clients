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

export interface SystemVersionChange {
  scope: 'frontend' | 'backend';
  message: string;
}

@Entity('system_versions')
@Index('idx_system_versions_tenant_released', ['tenant_id', 'released_at'])
@Index('uq_system_versions_tenant_release', ['tenant_id', 'release_key'], { unique: true })
export class SystemVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 160 })
  release_key: string;

  @Column({ type: 'varchar', length: 32 })
  version: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  build_id: string | null;

  @Column({ type: 'varchar', length: 16 })
  channel: 'frontend' | 'backend' | 'full';

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'json' })
  changes: SystemVersionChange[];

  @Column({ type: 'datetime' })
  released_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
