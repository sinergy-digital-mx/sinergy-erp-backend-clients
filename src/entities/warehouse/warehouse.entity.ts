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

@Entity('warehouses')
@Index('tenant_index', ['tenant_id'])
@Index('status_index', ['status'])
@Index('code_index', ['code'])
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  // Basic Information
  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  // Address Information
  @Column({ nullable: true })
  street: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zip_code: string;

  @Column({ nullable: true })
  country: string;

  // Status
  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: string;

  // Fiscal Configuration Reference
  @ManyToOne('FiscalConfiguration', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fiscal_configuration_id' })
  fiscal_configuration: any;

  @Column({ nullable: true })
  fiscal_configuration_id: string;

  // Metadata for extensibility
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
