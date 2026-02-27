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

@Entity('payments')
@Index('tenant_index', ['tenant_id'])
@Index('contract_index', ['contract_id'])
@Index('status_index', ['status'])
@Index('due_date_index', ['due_date'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Column()
  contract_id: string;

  @Column({ type: 'int' })
  payment_number: number; // 1, 2, 3, etc.

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number; // Monto total esperado del pago

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount_paid: number; // Monto realmente pagado (puede ser parcial)

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount_pending: number; // Diferencia pendiente (amount - amount_paid)

  @Column({ type: 'date' })
  due_date: Date;

  @Column({ type: 'date', nullable: true })
  paid_date: Date | null; // Fecha del último pago

  @Column({ type: 'date', nullable: true })
  first_partial_payment_date: Date | null; // Fecha del primer pago parcial

  @Column({
    type: 'enum',
    enum: ['pendiente', 'pagado', 'parcial', 'vencido', 'cancelado'],
    default: 'pendiente',
  })
  status: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_method: string | null; // efectivo, transferencia, tarjeta, cheque

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference_number: string | null; // Número de referencia bancaria

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

