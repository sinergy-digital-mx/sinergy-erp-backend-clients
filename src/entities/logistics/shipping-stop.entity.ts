import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { SalesOrder } from '../sales-orders/sales-order.entity';
import { CustomerAddress } from '../customers/customer-address.entity';
import { Shipping } from './shipping.entity';

export type LocationStatus = 'ok' | 'without_location';

@Entity('shipping_stops')
@Index('idx_shipping_stops_tenant', ['tenant_id'])
@Index('idx_shipping_stops_shipping', ['shipping_id'])
@Index('idx_shipping_stops_sales_order', ['tenant_id', 'sales_order_id'])
export class ShippingStop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Shipping, (shipping) => shipping.stops, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'shipping_id' })
  shipping: Shipping;

  @Column()
  shipping_id: string;

  @ManyToOne(() => SalesOrder, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrder;

  @Column()
  sales_order_id: string;

  @Column({ type: 'int' })
  stop_sequence: number;

  @ManyToOne(() => CustomerAddress, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'customer_address_id' })
  customer_address: CustomerAddress | null;

  @Column({ type: 'int', nullable: true })
  customer_address_id: number | null;

  @Column({ type: 'varchar', length: 30, default: 'without_location' })
  location_status: LocationStatus;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  delivery_latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  delivery_longitude: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  distance_from_previous_km: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
