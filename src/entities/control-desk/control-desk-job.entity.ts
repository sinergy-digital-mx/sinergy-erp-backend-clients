import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { SalesOrder } from '../sales-orders/sales-order.entity';
import { BillingBranch } from '../billing/billing-branch.entity';
import { ControlDeskPosition } from './control-desk-position.entity';
import { ControlDeskPickTask } from './control-desk-pick-task.entity';
import type { ControlDeskJobStatus } from './control-desk.constants';

@Entity('control_desk_jobs')
@Index('idx_cd_jobs_tenant', ['tenant_id'])
@Index('idx_cd_jobs_tenant_status', ['tenant_id', 'status'])
@Index('idx_cd_jobs_tenant_branch', ['tenant_id', 'billing_branch_id'])
@Index('uq_cd_jobs_sales_order', ['sales_order_id'], { unique: true })
@Index('uq_cd_jobs_position', ['position_id'], { unique: true })
export class ControlDeskJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => SalesOrder, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrder;

  @Column()
  sales_order_id: string;

  @ManyToOne(() => BillingBranch, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'billing_branch_id' })
  billing_branch: BillingBranch;

  @Column()
  billing_branch_id: string;

  @ManyToOne(() => ControlDeskPosition, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'position_id' })
  position: ControlDeskPosition | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  position_id: string | null;

  @Column({ type: 'varchar', length: 32, default: 'released' })
  status: ControlDeskJobStatus;

  @Column({ type: 'tinyint', default: 0 })
  has_shortage: boolean;

  @Column()
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ nullable: true })
  updated_by: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => ControlDeskPickTask, (task) => task.job)
  tasks: ControlDeskPickTask[];
}
