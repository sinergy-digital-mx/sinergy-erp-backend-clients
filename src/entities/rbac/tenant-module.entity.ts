import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from './tenant.entity';
import { Module } from './module.entity';

@Entity('tenant_modules')
@Index('tenant_index', ['tenant_id'])
@Index('module_index', ['module_id'])
@Index('tenant_module_index', ['tenant_id', 'module_id'], { unique: true })
export class TenantModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Module, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @Column()
  module_id: string;

  @Column({ type: 'tinyint', default: 1 })
  is_enabled: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
