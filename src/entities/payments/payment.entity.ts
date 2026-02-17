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
import { Contract } from '../contracts/contract.entity';
import { RBACTenant } from '../rbac/tenant.entity';

@Entity('payments')
@Index('tenant_index', ['tenant_id'])
@Index('contract_index', ['contract_id'])
@Index('payment_date_index', ['payment_date'])
@Index('status_index', ['status'])
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

  @Column({ length: 50, default: 'transferencia' })
  payment_method: string;

  @Column({
    type: 'enum',
    enum: ['pagado', 'pendiente', 'atrasado', 'cancelado'],
    default: 'pagado',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
