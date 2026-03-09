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
import { Product } from '../products/product.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { UoM } from '../products/uom.entity';

@Entity('stock_reservations')
@Index('stock_reservations_tenant_idx', ['tenant_id'])
@Index('stock_reservations_product_idx', ['product_id'])
@Index('stock_reservations_warehouse_idx', ['warehouse_id'])
@Index('stock_reservations_reference_idx', ['reference_type', 'reference_id'])
@Index('stock_reservations_status_idx', ['status'])
export class StockReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @ManyToOne(() => UoM, { nullable: false })
  @JoinColumn({ name: 'uom_id' })
  uom: UoM;

  @Column()
  uom_id: string;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  quantity_reserved: number;

  @Column()
  reference_type: string;

  @Column({ type: 'uuid' })
  reference_id: string;

  @Column({
    type: 'enum',
    enum: ['active', 'fulfilled', 'cancelled', 'expired'],
    default: 'active',
  })
  status: string;

  @Column({ type: 'timestamp' })
  reserved_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  fulfilled_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
