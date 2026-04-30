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
import { Customer } from '../customers/customer.entity';
import { User } from '../users/user.entity';
import { SalesOrderDetail } from './sales-order-detail.entity';

@Entity('inv_s_sales_orders')
@Index('idx_so_tenant', ['tenant_id'])
@Index('idx_so_customer', ['customer_id'])
@Index('idx_so_warehouse', ['warehouse_id'])
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

  @Column({ length: 20, unique: true })
  folio: string;

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

  @Column({
    type: 'enum',
    enum: ['Creada', 'Surtida', 'Cancelada'],
    default: 'Creada',
  })
  general_status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  iva_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ieps_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column()
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ nullable: true })
  updated_by: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => SalesOrderDetail, (detail) => detail.sales_order)
  line_items: SalesOrderDetail[];
}
