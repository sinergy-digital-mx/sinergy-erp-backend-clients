import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PosPartialShift } from './pos-partial-shift.entity';

@Entity('pos_partial_shift_denominations')
@Index('idx_pos_partial_denom_partial', ['partial_shift_id'])
export class PosPartialShiftDenomination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  partial_shift_id: string;

  @ManyToOne(() => PosPartialShift, (partial) => partial.denominations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partial_shift_id' })
  partial_shift: PosPartialShift;

  @Column({ type: 'enum', enum: ['MXN', 'USD'] })
  currency: 'MXN' | 'USD';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  denomination: number;

  @Column({ type: 'int' })
  bill_count: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;
}
