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

@Entity('control_desk_positions')
@Index('idx_cd_positions_tenant', ['tenant_id'])
@Index('idx_cd_positions_branch', ['tenant_id', 'billing_branch_id'])
@Index('uq_cd_positions_branch_code', ['tenant_id', 'billing_branch_id', 'code'], {
  unique: true,
})
export class ControlDeskPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => BillingBranch, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'billing_branch_id' })
  billing_branch: BillingBranch;

  @Column()
  billing_branch_id: string;

  @Column({ length: 20 })
  code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @Column({ type: 'int', default: 0 })
  row: number;

  @Column({ type: 'int', default: 0 })
  col: number;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'tinyint', default: 1 })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
