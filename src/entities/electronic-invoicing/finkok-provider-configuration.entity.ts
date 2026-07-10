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
import { User } from '../users/user.entity';

export type FinkokEnvironment = 'demo' | 'production';

@Entity('finkok_provider_configurations')
@Index('uq_finkok_provider_tenant_env', ['tenant_id', 'environment'], { unique: true })
export class FinkokProviderConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column({ type: 'varchar', length: 255 })
  finkok_username: string;

  @Column({ type: 'text' })
  finkok_username_encrypted: string;

  @Column({ type: 'varchar', length: 32 })
  finkok_username_iv: string;

  @Column({ type: 'text' })
  finkok_password_encrypted: string;

  @Column({ type: 'varchar', length: 32 })
  finkok_password_iv: string;

  @Column({
    type: 'enum',
    enum: ['demo', 'production'],
    default: 'demo',
  })
  environment: FinkokEnvironment;

  @Column({ type: 'tinyint', default: 1 })
  is_active: number;

  /** Ambiente usado por defecto al timbrar/cancelar cuando no se especifica otro */
  @Column({ type: 'tinyint', default: 0 })
  is_stamping_default: number;

  @Column({ type: 'timestamp', nullable: true })
  last_connection_test_at: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  last_connection_test_status: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: User;

  @Column({ type: 'varchar', length: 36, nullable: true })
  updated_by: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
