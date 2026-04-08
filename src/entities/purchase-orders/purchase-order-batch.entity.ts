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
import { Warehouse } from '../warehouse/warehouse.entity';
import { Vendor } from '../vendor/vendor.entity';
import { User } from '../users/user.entity';
import { PurchaseOrderBatchDetail } from './purchase-order-batch-detail.entity';
import { InventoryBatch } from './inventory-batch.entity';

@Entity('inv_s_purchase_order_batch')
@Index('idx_tenant', ['tenant_id'])
@Index('idx_general_status', ['general_status'])
@Index('idx_payment_status', ['payment_status'])
@Index('idx_vendor', ['vendor_id'])
@Index('idx_warehouse', ['warehouse_id'])
@Index('idx_expected_delivery', ['expected_delivery_date'])
export class PurchaseOrderBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => FiscalConfiguration, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'fiscal_configuration_id' })
  fiscal_configuration: FiscalConfiguration;

  @Column()
  fiscal_configuration_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @ManyToOne(() => Vendor, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column()
  vendor_id: string;

  @Column({ length: 20, unique: true })
  folio: string;

  @Column({ type: 'date' })
  expected_delivery_date: Date;

  @Column({
    type: 'enum',
    enum: ['Pendiente', 'Pagado'],
    default: 'Pendiente',
  })
  payment_status: string;

  @Column({
    type: 'enum',
    enum: ['Creada', 'Recibida', 'Cancelada'],
    default: 'Creada',
  })
  general_status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  requested_subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  requested_iva_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  requested_ieps_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  requested_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  received_subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  received_iva_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  received_ieps_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  received_total: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column()
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: User;

  @Column({ nullable: true })
  updated_by: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => PurchaseOrderBatchDetail, (detail: PurchaseOrderBatchDetail) => detail.purchase_order_batch)
  line_items: PurchaseOrderBatchDetail[];

  @OneToMany(() => InventoryBatch, (batch: InventoryBatch) => batch.purchase_order_batch)
  batches: InventoryBatch[];
}
