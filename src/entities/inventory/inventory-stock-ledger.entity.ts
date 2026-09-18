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
import { UoMCatalog } from '../uom-catalog/uom-catalog.entity';
import { InventoryBatch } from '../purchase-orders/inventory-batch.entity';
import { User } from '../users/user.entity';
import { InventoryStockLedgerMovementType } from './inventory-stock-ledger-movement-type.enum';

/**
 * Kardex append-only: cada entrada/salida de inventario con saldo corrido
 * por producto + almacén + UOM.
 */
@Entity('inv_s_stock_ledger')
@Index('idx_stock_ledger_tenant', ['tenant_id'])
@Index('idx_stock_ledger_balance_key', [
  'tenant_id',
  'warehouse_id',
  'product_id',
  'uom_id',
  'occurred_at',
])
@Index('idx_stock_ledger_reference', ['tenant_id', 'reference_type', 'reference_id'])
@Index('idx_stock_ledger_batch', ['tenant_id', 'inventory_batch_id'])
export class InventoryStockLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @ManyToOne(() => UoMCatalog, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'uom_id' })
  uom: UoMCatalog;

  @Column()
  uom_id: string;

  @ManyToOne(() => InventoryBatch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'inventory_batch_id' })
  inventory_batch: InventoryBatch | null;

  @Column({ nullable: true })
  inventory_batch_id: string | null;

  @Column({
    type: 'enum',
    enum: InventoryStockLedgerMovementType,
  })
  movement_type: InventoryStockLedgerMovementType;

  /** Delta firmado: positivo = entrada, negativo = salida */
  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity_delta: number;

  /** Saldo corrido producto + almacén + UOM después de este movimiento */
  @Column({ type: 'decimal', precision: 12, scale: 3 })
  balance_after: number;

  /**
   * Costo unitario MXN congelado al momento del movimiento
   * (preferir costo real MXN; si no, vendor × T.C. aduana / MXN).
   */
  @Column({ type: 'decimal', precision: 16, scale: 4, nullable: true })
  unit_cost_mxn: number | null;

  /**
   * Precio unitario de venta MXN congelado:
   * - venta / cancelación: unit_price de la OV
   * - entradas: precio de lista vigente al momento (si existe)
   */
  @Column({ type: 'decimal', precision: 16, scale: 4, nullable: true })
  unit_sale_price_mxn: number | null;

  /** Valor de inventario a costo (MXN) después de este movimiento */
  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  cost_balance_after_mxn: number | null;

  @Column({ type: 'timestamp' })
  occurred_at: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reference_type: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  reference_id: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reference_folio: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by_user: User | null;

  @Column({ nullable: true })
  created_by: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
