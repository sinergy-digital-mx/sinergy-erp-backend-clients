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

@Entity('inventory_items')
@Index('inventory_items_tenant_idx', ['tenant_id'])
@Index('inventory_items_product_idx', ['product_id'])
@Index('inventory_items_warehouse_idx', ['warehouse_id'])
@Index('inventory_items_unique_idx', ['tenant_id', 'product_id', 'warehouse_id', 'uom_id', 'location'], { unique: true })
export class InventoryItem {
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

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  quantity_on_hand: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  quantity_reserved: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  quantity_available: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  reorder_point: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  reorder_quantity: number;

  @Column({ nullable: true })
  location: string;

  @Column({
    type: 'enum',
    enum: ['FIFO', 'LIFO', 'Weighted_Average'],
    default: 'Weighted_Average',
  })
  valuation_method: string;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  unit_cost: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  total_value: number;

  @Column({ type: 'json', nullable: true })
  cost_layers: Array<{ quantity: number; unit_cost: number; date: Date }>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
