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
import { User } from '../users/user.entity';
import { PurchaseOrderBatch } from '../purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderPayment } from '../purchase-orders/purchase-order-payment.entity';
import { Vendor } from './vendor.entity';
import { VendorCreditLedgerEntryType } from './vendor-credit-ledger-entry-type.enum';

@Entity('vendor_credit_ledger')
@Index('idx_vendor_credit_ledger_tenant_vendor', ['tenant_id', 'vendor_id'])
@Index('idx_vendor_credit_ledger_payment', ['purchase_order_payment_id'])
export class VendorCreditLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column()
  vendor_id: string;

  @Column({ type: 'enum', enum: ['MXN', 'USD'] })
  currency: 'MXN' | 'USD';

  @Column({ type: 'enum', enum: VendorCreditLedgerEntryType })
  entry_type: VendorCreditLedgerEntryType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @ManyToOne(() => PurchaseOrderBatch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'purchase_order_id' })
  purchase_order: PurchaseOrderBatch | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  purchase_order_id: string | null;

  @ManyToOne(() => PurchaseOrderPayment, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'purchase_order_payment_id' })
  purchase_order_payment: PurchaseOrderPayment | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  purchase_order_payment_id: string | null;

  @ManyToOne(() => VendorCreditLedger, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'source_entry_id' })
  source_entry: VendorCreditLedger | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  source_entry_id: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
