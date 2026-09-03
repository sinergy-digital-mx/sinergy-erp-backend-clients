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
import { FiscalConfiguration } from '../billing/fiscal-configuration.entity';
import { BillingBranch } from '../billing/billing-branch.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Customer } from '../customers/customer.entity';
import { User } from '../users/user.entity';
import { GlobalDiscount } from '../global-discounts/global-discount.entity';
import { QuotationDetail } from './quotation-detail.entity';

@Entity('inv_s_quotations')
@Index('idx_qt_tenant', ['tenant_id'])
@Index('uq_qt_tenant_folio', ['tenant_id', 'folio'], { unique: true })
@Index('idx_qt_customer', ['customer_id'])
@Index('idx_qt_warehouse', ['warehouse_id'])
@Index('idx_qt_billing_branch', ['billing_branch_id'])
@Index('idx_qt_general_status', ['general_status'])
@Index('idx_qt_converted_so', ['converted_to_sales_order_id'])
export class Quotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  /** Folio COT-000001, único por organización. */
  @Column({ length: 20 })
  folio: string;

  @ManyToOne(() => FiscalConfiguration, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'fiscal_configuration_id' })
  fiscal_configuration: FiscalConfiguration;

  @Column()
  fiscal_configuration_id: string;

  @ManyToOne(() => BillingBranch, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'billing_branch_id' })
  billing_branch: BillingBranch | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  billing_branch_id: string | null;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  warehouse_id: string | null;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  customer_id: number;

  @Column({ type: 'date' })
  expected_delivery_date: Date;

  @Column({
    type: 'enum',
    enum: ['POS', 'MANUAL'],
    default: 'MANUAL',
  })
  quotation_type: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fiscal_razon_social: string | null;

  @Column({
    type: 'enum',
    enum: ['Creada', 'Convertida', 'Cancelada'],
    default: 'Creada',
  })
  general_status: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  iva_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ieps_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount_total: number;

  @ManyToOne(() => GlobalDiscount, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'global_discount_id' })
  global_discount: GlobalDiscount | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  global_discount_id: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  global_discount_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column()
  created_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'terminal_user_id' })
  terminal_user: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  terminal_user_id: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'seller_user_id' })
  seller_user: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  seller_user_id: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_seller_user_id' })
  assigned_seller_user: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  assigned_seller_user_id: string | null;

  /** OV generada al convertir. No hay FK TypeORM para evitar ciclo. */
  @Column({ type: 'varchar', length: 36, nullable: true })
  converted_to_sales_order_id: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ nullable: true })
  updated_by: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => QuotationDetail, (detail) => detail.quotation)
  line_items: QuotationDetail[];
}
