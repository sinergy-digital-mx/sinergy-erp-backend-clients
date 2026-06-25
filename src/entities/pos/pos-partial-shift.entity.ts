import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
import { PosDailyShift } from './pos-daily-shift.entity';
import { PosPartialShiftDenomination } from './pos-partial-shift-denomination.entity';

@Entity('pos_partial_shifts')
@Index('idx_pos_partial_shifts_daily', ['daily_shift_id'])
export class PosPartialShift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @ManyToOne(() => RBACTenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  daily_shift_id: string;

  @ManyToOne(() => PosDailyShift, (shift) => shift.partial_shifts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'daily_shift_id' })
  daily_shift: PosDailyShift;

  @Column({ type: 'int' })
  partial_number: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  removed_total_mxn: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  removed_total_usd: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  sales_total_mxn: number;

  @Column({ type: 'int', default: 0 })
  sales_count: number;

  @Column({ nullable: true })
  performed_by_user_id: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performed_by_user_id' })
  performed_by_user: User | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => PosPartialShiftDenomination, (denom) => denom.partial_shift, {
    cascade: true,
  })
  denominations: PosPartialShiftDenomination[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
