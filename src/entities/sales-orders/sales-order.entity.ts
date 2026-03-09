// src/entities/sales-orders/sales-order.entity.ts
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
import { Customer } from '../customers/customer.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { SalesOrderLine } from './sales-order-line.entity';

@Entity('sales_orders')
@Index('sales_orders_tenant_idx', ['tenant_id'])
@Index('sales_orders_status_idx', ['status'])
@Index('sales_orders_customer_idx', ['customer_id'])
@Index('sales_orders_warehouse_idx', ['warehouse_id'])
export class SalesOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

  @Column({ nullable: true })
  customer_id: number | null;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, type: 'date' })
  delivery_date: Date | null;

  @Column({
    type: 'enum',
    enum: ['draft', 'confirmed', 'processing', 'completed', 'cancelled'],
    default: 'draft',
  })
  status: string;

  // Totals (calculated from line items)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_iva: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_ieps: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  grand_total: number;

  @OneToMany(() => SalesOrderLine, (line) => line.sales_order, {
    cascade: true,
    eager: true,
  })
  lines: SalesOrderLine[];

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
