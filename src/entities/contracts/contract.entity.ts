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
import { User } from '../users/user.entity';
import { Lead } from '../leads/lead.entity';
import { LeadGroup } from '../leads/lead-group.entity';

@Entity('contracts')
@Index('tenant_index', ['tenant_id'])
@Index('customer_index', ['customer_id'])
@Index('property_index', ['property_id'])
@Index('status_index', ['status'])
@Index('seller_index', ['seller_id'])
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

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column({ nullable: true })
  seller_id: string;

  @ManyToOne(() => Lead, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead | null;

  @Column({ nullable: true })
  lead_id: number | null;

  @ManyToOne(() => LeadGroup, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'lead_group_id' })
  lead_group: LeadGroup | null;

  @Column({ nullable: true })
  lead_group_id: string | null;

  @Column({ length: 50 })
  contract_number: string;

  @Column({ type: 'date' })
  contract_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_price: number;

  /** Precio de lista del lote al momento de la venta (snapshot). */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  list_price: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  down_payment: number;

  /** Enganche total pactado cuando se financia en pagos (meta contractual). */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  down_payment_target: number | null;

  @Column({ type: 'boolean', default: false })
  down_payment_financed: boolean;

  @Column({ type: 'int', nullable: true })
  down_payment_months: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  down_payment_monthly_amount: number | null;

  @Column({ type: 'date', nullable: true })
  down_payment_first_payment_date: Date | null;

  @Column({ type: 'int', nullable: true })
  down_payment_payment_day: number | null;

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
