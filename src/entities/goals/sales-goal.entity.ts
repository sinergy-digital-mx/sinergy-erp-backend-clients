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
import { Role } from '../rbac/role.entity';
import { User } from '../users/user.entity';

export enum SalesGoalScope {
  BRANCH = 'branch',
  USER_ROLE = 'user_role',
}

export enum SalesGoalMetricType {
  SALES_COUNT = 'sales_count',
  AMOUNT = 'amount',
}

export enum SalesGoalPeriodType {
  MONTH = 'month',
  WEEK = 'week',
  YEAR = 'year',
  CUSTOM = 'custom',
}

@Entity('sales_goals')
@Index('idx_sales_goals_tenant', ['tenant_id'])
@Index('idx_sales_goals_branch', ['billing_branch_id'])
@Index('idx_sales_goals_period', ['period_type', 'period_year', 'period_month'])
export class SalesGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  /** branch = meta de sucursal; user_role = meta individual para usuarios del rol. */
  @Column({ type: 'enum', enum: SalesGoalScope })
  goal_scope: SalesGoalScope;

  @ManyToOne(() => BillingBranch, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'billing_branch_id' })
  billing_branch: BillingBranch;

  @Column({ type: 'varchar', length: 36 })
  billing_branch_id: string;

  /** Obligatorio si goal_scope = user_role (ej. rol "Vendedor", "Vendedor área", etc.). */
  @ManyToOne(() => Role, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: Role | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  role_id: string | null;

  @Column({ type: 'enum', enum: SalesGoalMetricType })
  metric_type: SalesGoalMetricType;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  target_value: number;

  /** Por ahora se usa month; week/year/custom quedan listos. */
  @Column({ type: 'enum', enum: SalesGoalPeriodType, default: SalesGoalPeriodType.MONTH })
  period_type: SalesGoalPeriodType;

  @Column({ type: 'int', nullable: true })
  period_year: number | null;

  @Column({ type: 'int', nullable: true })
  period_month: number | null;

  @Column({ type: 'date', nullable: true })
  period_start: Date | null;

  @Column({ type: 'date', nullable: true })
  period_end: Date | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
