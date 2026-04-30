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

@Entity('contract_downpayment_payments')
@Index('contract_downpayment_payments_tenant_index', ['tenant_id'])
@Index('contract_downpayment_payments_contract_index', ['contract_id'])
@Index('contract_downpayment_payments_due_date_index', ['due_date'])
@Index('contract_downpayment_payments_status_index', ['status'])
export class ContractDownpaymentPayment {
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

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount_paid: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount_pending: number;

  @Column({ type: 'date' })
  due_date: Date;

  @Column({ type: 'date', nullable: true })
  paid_date: Date | null;

  @Column({ type: 'date', nullable: true })
  first_partial_payment_date: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_method: string | null;

  @Column({
    type: 'enum',
    enum: ['pagado', 'pendiente', 'parcial', 'cancelado'],
    default: 'pendiente',
  })
  status: string;

  @Column({ type: 'boolean', default: false })
  is_overdue: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
