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
import { Customer } from '../customers/customer.entity';
import { Property } from '../properties/property.entity';
import { RBACTenant } from '../rbac/tenant.entity';

@Entity('contracts')
@Index('tenant_index', ['tenant_id'])
@Index('customer_index', ['customer_id'])
@Index('property_index', ['property_id'])
@Index('status_index', ['status'])
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  customer_id: number;

  @ManyToOne(() => Property, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column()
  property_id: string;

  @Column({ length: 50 })
  contract_number: string;

  @Column({ type: 'date' })
  contract_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  down_payment: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  remaining_balance: number;

  @Column({ type: 'int' })
  payment_months: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  monthly_payment: number;

  @Column({ type: 'date' })
  first_payment_date: Date;

  @Column({ type: 'int', nullable: true })
  payment_due_day: number; // Días límite de pago (ej: 5 días después de la fecha de vencimiento)

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  interest_rate: number; // Porcentaje de interés moratorio (ej: 0.10 = 10%)

  @Column({ length: 10, default: 'MXN' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['activo', 'completado', 'cancelado', 'suspendido'],
    default: 'activo',
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
