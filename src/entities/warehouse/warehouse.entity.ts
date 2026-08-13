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
import { BillingBranch } from '../billing/billing-branch.entity';

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

  @Column({ length: 10, nullable: true })
  prefix: string;

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

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number | null;

  // Status
  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: string;

  // Billing Branch Reference
  @ManyToOne(() => BillingBranch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'billing_branch_id' })
  billing_branch: BillingBranch | null;

  @Column({ nullable: true })
  billing_branch_id: string;

  // Metadata for extensibility
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
