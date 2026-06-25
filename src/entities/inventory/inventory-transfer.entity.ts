import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Product } from '../products/product.entity';
import { UoMCatalog } from '../uom-catalog/uom-catalog.entity';
import { User } from '../users/user.entity';
import { InventoryTransferStatus } from './inventory-transfer-status.enum';
import { InventoryTransferLine } from './inventory-transfer-line.entity';

@Entity('inv_s_inventory_transfers')
@Index('idx_transfer_tenant', ['tenant_id'])
@Index('idx_transfer_folio', ['tenant_id', 'folio'], { unique: true })
@Index('idx_transfer_source_wh', ['source_warehouse_id'])
@Index('idx_transfer_dest_wh', ['destination_warehouse_id'])
@Index('idx_transfer_product', ['product_id'])
@Index('idx_transfer_created_at', ['created_at'])
export class InventoryTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column({ length: 20 })
  folio: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => UoMCatalog, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'uom_id' })
  uom: UoMCatalog;

  @Column()
  uom_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'source_warehouse_id' })
  source_warehouse: Warehouse;

  @Column()
  source_warehouse_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'destination_warehouse_id' })
  destination_warehouse: Warehouse;

  @Column()
  destination_warehouse_id: string;

  /** Suma de cantidades transferidas en todas las líneas */
  @Column({ type: 'decimal', precision: 12, scale: 3 })
  total_quantity: number;

  @Column({
    type: 'enum',
    enum: InventoryTransferStatus,
    default: InventoryTransferStatus.COMPLETED,
  })
  status: InventoryTransferStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

  @Column()
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @OneToMany(() => InventoryTransferLine, (line) => line.inventory_transfer)
  lines: InventoryTransferLine[];
}
