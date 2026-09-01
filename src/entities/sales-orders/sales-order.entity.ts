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
import { PosDailyShift } from '../pos/pos-daily-shift.entity';
import { SalesOrderDetail } from './sales-order-detail.entity';
import { GlobalDiscount } from '../global-discounts/global-discount.entity';

@Entity('inv_s_sales_orders')
@Index('idx_so_tenant', ['tenant_id'])
@Index('uq_so_tenant_folio', ['tenant_id', 'folio'], { unique: true })
@Index('uq_so_public_invoice_code', ['public_invoice_code'], { unique: true })
@Index('idx_so_customer', ['customer_id'])
@Index('idx_so_warehouse', ['warehouse_id'])
@Index('idx_so_billing_branch', ['billing_branch_id'])
@Index('idx_so_general_status', ['general_status'])
@Index('idx_so_payment_status', ['payment_status'])
export class SalesOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column({ length: 20 })
  folio: string;

  /** Folio público único: `{RAZON}-{SUCURSAL}-INV-000012`. Para portal de autofactura. */
  @Column({ type: 'varchar', length: 48, nullable: true })
  public_invoice_code: string | null;

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
  sales_order_type: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fiscal_razon_social: string;

  @Column({
    type: 'enum',
    enum: ['Pendiente', 'Pagado'],
    default: 'Pendiente',
  })
  payment_status: string;

  /** True si el cobro POS se aplicó a crédito (sale de pendientes, el saldo sigue abierto). */
  @Column({ type: 'boolean', default: false })
  is_credit: boolean;

  /** El cajero pidió timbrar factura al cobrar. El XML lo arma el frontend. */
  @Column({ type: 'boolean', default: false })
  invoice_requested: boolean;

  @Column({
    type: 'enum',
    enum: [
      'Creada',
      'En Selección',
      'Lista para entrega',
      'Surtida',
      'Cancelada',
      'En cola',
      'En Camino',
    ],
    default: 'Creada',
  })
  general_status: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /** Si true, la OV entra en proceso de selección/armado (Control de almacén). */
  @Column({ type: 'boolean', default: false })
  requires_selection_assembly: boolean;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'corroborated_by' })
  corroborator: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  corroborated_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  corroborated_at: Date | null;

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
  terminal_user: User;

  @Column({ type: 'varchar', length: 36, nullable: true })
  terminal_user_id: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'seller_user_id' })
  seller_user: User;

  @Column({ type: 'varchar', length: 36, nullable: true })
  seller_user_id: string | null;

  /** Quien comisiona. Snapshot del vendedor asignado del cliente al crear; si no hay, el vendedor. */
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_seller_user_id' })
  assigned_seller_user: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  assigned_seller_user_id: string | null;

  @ManyToOne(() => PosDailyShift, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'pos_daily_shift_id' })
  pos_daily_shift: PosDailyShift;

  @Column({ type: 'varchar', length: 36, nullable: true })
  pos_daily_shift_id: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'collected_by_user_id' })
  collected_by_user: User;

  @Column({ type: 'varchar', length: 36, nullable: true })
  collected_by_user_id: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ nullable: true })
  updated_by: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => SalesOrderDetail, (detail) => detail.sales_order)
  line_items: SalesOrderDetail[];
}
