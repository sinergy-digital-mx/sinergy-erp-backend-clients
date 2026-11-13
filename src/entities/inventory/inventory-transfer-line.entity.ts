import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { InventoryTransfer } from './inventory-transfer.entity';
import { InventoryBatch } from '../purchase-orders/inventory-batch.entity';

/**
 * Detalle de una transferencia: cantidad tomada de un lote origen
 * y el lote destino generado en el almacén de llegada.
 */
@Entity('inv_s_inventory_transfer_lines')
@Index('idx_transfer_line_transfer', ['inventory_transfer_id'])
@Index('idx_transfer_line_source_batch', ['source_inventory_batch_id'])
@Index('idx_transfer_line_dest_batch', ['destination_inventory_batch_id'])
export class InventoryTransferLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InventoryTransfer, (transfer) => transfer.lines, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'inventory_transfer_id' })
  inventory_transfer: InventoryTransfer;

  @Column()
  inventory_transfer_id: string;

  @ManyToOne(() => InventoryBatch, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'source_inventory_batch_id' })
  source_inventory_batch: InventoryBatch;

  @Column()
  source_inventory_batch_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  quantity_received: number | null;

  @ManyToOne(() => InventoryBatch, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'destination_inventory_batch_id' })
  destination_inventory_batch: InventoryBatch | null;

  @Column({ type: 'varchar', length: '36', nullable: true })
  destination_inventory_batch_id: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
