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
import { User } from '../users/user.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Truck } from './truck.entity';
import { ShippingStop } from './shipping-stop.entity';

export const SHIPPING_STATUSES = [
  'Creado',
  'En Ruta',
  'Completado',
  'Cancelado',
] as const;

export type ShippingStatus = (typeof SHIPPING_STATUSES)[number];

@Entity('shippings')
@Index('idx_shippings_tenant', ['tenant_id'])
@Index('idx_shippings_status', ['status'])
@Index('idx_shippings_date', ['shipping_date'])
export class Shipping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column({ type: 'date' })
  shipping_date: Date;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column()
  created_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'edited_by' })
  editor: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  edited_by: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @Column({ type: 'varchar', length: 36 })
  driver_id: string;

  @ManyToOne(() => Truck, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'truck_id' })
  truck: Truck;

  @Column({ type: 'varchar', length: 36 })
  truck_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'origin_warehouse_id' })
  origin_warehouse: Warehouse;

  @Column({ type: 'varchar', length: 36 })
  origin_warehouse_id: string;

  @Column({ type: 'varchar', length: 30, default: 'Creado' })
  status: ShippingStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  distance_km: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => ShippingStop, (stop) => stop.shipping)
  stops: ShippingStop[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
