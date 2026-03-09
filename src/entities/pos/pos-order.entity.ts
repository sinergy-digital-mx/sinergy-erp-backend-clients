// src/entities/pos/pos-order.entity.ts
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
import { Warehouse } from '../warehouse/warehouse.entity';
import { User } from '../users/user.entity';

@Entity('pos_orders')
@Index('pos_orders_tenant_idx', ['tenant_id'])
@Index('pos_orders_warehouse_idx', ['warehouse_id'])
@Index('pos_orders_order_number_idx', ['order_number'])
@Index('pos_orders_status_idx', ['status'])
@Index('pos_orders_waiter_idx', ['waiter_id'])
@Index('pos_orders_date_idx', ['created_at'])
export class POSOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column()
  order_number: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'waiter_id' })
  waiter: User;

  @Column()
  waiter_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'cashier_id' })
  cashier: User;

  @Column({ nullable: true })
  cashier_id: string;

  @Column({ nullable: true })
  table_number: string;

  @Column({ nullable: true })
  zone: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'ready', 'paid', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tip: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @OneToMany(
    () => require('./pos-order-line.entity').POSOrderLine,
    (line: any) => line.pos_order,
    {
      cascade: true,
      eager: false,
    },
  )
  lines: any[];

  @OneToMany(
    () => require('./pos-payment.entity').POSPayment,
    (payment: any) => payment.pos_order,
    {
      cascade: true,
      eager: false,
    },
  )
  payments: any[];

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
