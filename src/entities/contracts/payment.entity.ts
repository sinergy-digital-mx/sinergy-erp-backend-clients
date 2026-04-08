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
import { Contract } from './contract.entity';
import { RBACTenant } from '../rbac/tenant.entity';

@Entity('contract_payments')
@Index('contract_payments_tenant_index', ['tenant_id'])
@Index('contract_payments_contract_index', ['contract_id'])
@Index('contract_payments_payment_date_index', ['payment_date'])
@Index('contract_payments_due_date_index', ['due_date'])
@Index('contract_payments_status_index', ['status'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Contract, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Column()
  contract_id: string;

  @Column({ length: 50 })
  payment_number: string;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount_paid: number;

  // New fields for partial payments support
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount: number; // Total expected amount

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount_pending: number; // Remaining amount to pay

  @Column({ type: 'date', nullable: true })
  due_date: Date; // When payment is due (5th of each month)

  @Column({ type: 'date', nullable: true })
  paid_date: Date; // When payment was actually made

  @Column({ type: 'date', nullable: true })
  first_partial_payment_date: Date; // First partial payment date

  @Column({ length: 50, default: 'transferencia' })
  payment_method: string;

  @Column({
    type: 'enum',
    enum: ['pagado', 'pendiente', 'parcial', 'cancelado'],
    default: 'pendiente',
  })
  status: string;

  @Column({ type: 'boolean', default: false })
  is_overdue: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
