import { PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn, Entity, Index } from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { Customer } from '../customers/customer.entity';
import { FiscalConfiguration } from '../billing/fiscal-configuration.entity';
import { BillingBranch } from '../billing/billing-branch.entity';
import { SalesOrder } from '../sales-orders/sales-order.entity';
import { SalesOrderPayment } from '../sales-orders/sales-order-payment.entity';
import { User } from '../users/user.entity';
import { CustomerDebtLedgerMovementType } from './customer-debt-ledger-movement-type.enum';

@Entity('acc_customer_debt_ledger')
@Index('uq_customer_debt_ledger_source', ['tenant_id', 'source_key'], { unique: true })
@Index('idx_customer_debt_ledger_fiscal', ['tenant_id', 'fiscal_configuration_id', 'occurred_at'])
@Index('idx_customer_debt_ledger_customer', [
        'tenant_id',
        'customer_id',
        'fiscal_configuration_id',
        'occurred_at',
    ])
@Index('idx_customer_debt_ledger_order', ['tenant_id', 'sales_order_id'])
export class CustomerDebtLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column({ type: 'varchar', length: 80 })
  source_key: string;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  customer_id: number;

  @ManyToOne(() => FiscalConfiguration, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'fiscal_configuration_id' })
  fiscal_configuration: FiscalConfiguration;

  @Column()
  fiscal_configuration_id: string;

  @Column({ type: 'varchar', length: 255 })
  fiscal_razon_social: string;

  @ManyToOne(() => BillingBranch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'billing_branch_id' })
  billing_branch: BillingBranch | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  billing_branch_id: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  billing_branch_name: string | null;

  @ManyToOne(() => SalesOrder, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrder;

  @Column()
  sales_order_id: string;

  @ManyToOne(() => SalesOrderPayment, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sales_order_payment_id' })
  sales_order_payment: SalesOrderPayment | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  sales_order_payment_id: string | null;

  @Column({
        type: 'enum',
        enum: CustomerDebtLedgerMovementType,
    })
  movement_type: CustomerDebtLedgerMovementType;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount_delta: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  balance_after: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  order_balance_after: number;

  @Column({ type: 'timestamp' })
  occurred_at: Date;

  @Column({ type: 'date', nullable: true })
  due_date: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  payment_method: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  reference_number: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  source: string | null;

  @Column({ type: 'varchar', length: 20 })
  folio: string;

  @Column({ type: 'varchar', length: 255 })
  customer_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  customer_rfc: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by_user: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}

