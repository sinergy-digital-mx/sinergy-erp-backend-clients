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
import { Product } from '../products/product.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { UoM } from '../products/uom.entity';
import { User } from '../users/user.entity';

@Entity('inventory_movements')
@Index('inventory_movements_tenant_idx', ['tenant_id'])
@Index('inventory_movements_product_idx', ['product_id'])
@Index('inventory_movements_warehouse_idx', ['warehouse_id'])
@Index('inventory_movements_date_idx', ['movement_date'])
@Index('inventory_movements_reference_idx', ['reference_type', 'reference_id'])
export class InventoryMovement {
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

  @Column({
    type: 'enum',
    enum: [
      'purchase_receipt',
      'sales_shipment',
      'adjustment',
      'transfer_in',
      'transfer_out',
      'initial_balance',
      'return_to_vendor',
      'return_from_customer',
    ],
  })
  movement_type: string;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  unit_cost: number;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  total_cost: number;

  @Column({ nullable: true })
  reference_type: string;

  @Column({ type: 'uuid', nullable: true })
  reference_id: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  lot_number: string;

  @Column({ nullable: true })
  serial_number: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp' })
  movement_date: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by_user_id' })
  created_by_user: User;

  @Column()
  created_by_user_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
