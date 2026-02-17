import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { IsBoolean, IsOptional } from 'class-validator';

@Entity('tenant_modules')
@Index('tenant_module_index', ['tenant_id', 'module_id'], { unique: true })
@Index('tenant_index', ['tenant_id'])
@Index('module_index', ['module_id'])
export class TenantModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('RBACTenant', 'tenant_modules', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: any;

  @Column()
  tenant_id: string;

  @ManyToOne('Module', 'tenant_modules', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: any;

  @Column()
  module_id: string;

  @Column({ default: true })
  @IsBoolean()
  @IsOptional()
  is_enabled: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
