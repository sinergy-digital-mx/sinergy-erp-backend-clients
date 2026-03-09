import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { User } from '../users/user.entity';

@Entity('cash_shifts')
@Index('cash_shifts_tenant_idx', ['tenant_id'])
@Index('cash_shifts_warehouse_idx', ['warehouse_id'])
@Index('cash_shifts_cashier_idx', ['cashier_id'])
@Index('cash_shifts_status_idx', ['status'])
export class CashShift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'cashier_id' })
  cashier: User;

  @Column()
  cashier_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  initial_cash: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  final_cash: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  expected_cash: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  difference: number;

  @Column({
    type: 'enum',
    enum: ['open', 'closed'],
    default: 'open',
  })
  status: string;

  @Column({ type: 'timestamp' })
  opened_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  closed_at: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
