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
import { User } from '../users/user.entity';
import { BillingBranch } from '../billing/billing-branch.entity';
import { PosDailyShiftStatus } from './pos-daily-shift-status.enum';
import { PosPartialShift } from './pos-partial-shift.entity';

@Entity('pos_daily_shifts')
@Index('idx_pos_daily_shifts_tenant', ['tenant_id'])
@Index('idx_pos_daily_shifts_terminal_date', ['terminal_user_id', 'shift_date'])
export class PosDailyShift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @ManyToOne(() => RBACTenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  terminal_user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'terminal_user_id' })
  terminal_user: User;

  @Column()
  billing_branch_id: string;

  @ManyToOne(() => BillingBranch)
  @JoinColumn({ name: 'billing_branch_id' })
  billing_branch: BillingBranch;

  @Column({ type: 'date' })
  shift_date: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  opening_cash_mxn: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  opening_cash_usd: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  closing_cash_mxn: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  closing_cash_usd: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  expected_cash_mxn: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  expected_cash_usd: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cash_difference_mxn: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cash_difference_usd: number | null;

  @Column({ type: 'json', nullable: true })
  closing_denominations: Array<{
    currency: 'MXN' | 'USD';
    denomination: number;
    bill_count: number;
    amount: number;
  }> | null;

  @Column({
    type: 'enum',
    enum: PosDailyShiftStatus,
    default: PosDailyShiftStatus.OPEN,
  })
  status: PosDailyShiftStatus;

  @Column({ type: 'timestamp', nullable: true })
  closed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => PosPartialShift, (partial) => partial.daily_shift)
  partial_shifts: PosPartialShift[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
