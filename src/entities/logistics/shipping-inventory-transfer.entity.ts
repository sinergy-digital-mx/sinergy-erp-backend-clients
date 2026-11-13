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
import { InventoryTransfer } from '../inventory/inventory-transfer.entity';
import { Shipping } from './shipping.entity';

@Entity('shipping_inventory_transfers')
@Index('idx_shipping_transfer_tenant', ['tenant_id'])
@Index('idx_shipping_transfer_shipping', ['shipping_id'])
@Index('idx_shipping_transfer_transfer', ['inventory_transfer_id'])
export class ShippingInventoryTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Shipping, (shipping) => shipping.transfer_links, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'shipping_id' })
  shipping: Shipping;

  @Column()
  shipping_id: string;

  @ManyToOne(() => InventoryTransfer, (transfer) => transfer.shipping_links, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'inventory_transfer_id' })
  inventory_transfer: InventoryTransfer;

  @Column()
  inventory_transfer_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
