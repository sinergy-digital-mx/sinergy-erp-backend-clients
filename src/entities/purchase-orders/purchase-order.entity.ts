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
import { LineItem } from './line-item.entity';
import { Payment } from './payment.entity';
import { Document } from './document.entity';

@Entity('purchase_orders')
@Index('tenant_index', ['tenant_id'])
@Index('status_index', ['status'])
@Index('vendor_index', ['vendor_id'])
@Index('warehouse_index', ['warehouse_id'])
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  // Header Information
  @Column()
  vendor_id: string;

  @Column()
  creator_id: string;

  @Column()
  purpose: string;

  @Column()
  warehouse_id: string;

  @Column({ type: 'date' })
  tentative_receipt_date: Date;

  // Status
  @Column({
    type: 'enum',
    enum: ['En Proceso', 'Recibida', 'Cancelada'],
    default: 'En Proceso',
  })
  status: string;

  // Cancellation Information
  @Column({ nullable: true, type: 'date' })
  cancellation_date: Date;

  @Column({ nullable: true })
  cancellation_reason: string;

  // Payment Information
  @Column({
    type: 'enum',
    enum: ['Pagada', 'Parcial', 'No pagado'],
    default: 'No pagado',
  })
  payment_status: string;

  @Column({ nullable: true, type: 'date' })
  payment_date: Date;

  @Column({ nullable: true, type: 'decimal', precision: 12, scale: 2 })
  payment_amount: number;

  @Column({ nullable: true })
  payment_method: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  remaining_amount: number;

  // Totals (calculated from line items)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_iva: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_ieps: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  grand_total: number;

  // Relationships
  @OneToMany(() => LineItem, (lineItem) => lineItem.purchase_order, {
    cascade: true,
    eager: true,
  })
  line_items: LineItem[];

  @OneToMany(() => Payment, (payment) => payment.purchase_order, {
    cascade: true,
    eager: true,
  })
  payments: Payment[];

  @OneToMany(() => Document, (document) => document.purchase_order, {
    cascade: true,
  })
  documents: Document[];

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
