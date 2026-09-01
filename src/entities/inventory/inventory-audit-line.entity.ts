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
import { InventoryAudit } from './inventory-audit.entity';
import { InventoryBatch } from '../purchase-orders/inventory-batch.entity';
import { User } from '../users/user.entity';

/**
 * Línea de auditoría: snapshot del lote + cantidad contada y corrección aplicada.
 */
@Entity('inv_s_inventory_audit_lines')
@Index('idx_audit_line_audit', ['inventory_audit_id'])
@Index('idx_audit_line_batch', ['inventory_batch_id'])
@Index('uq_audit_line_batch', ['inventory_audit_id', 'inventory_batch_id'], {
  unique: true,
})
export class InventoryAuditLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InventoryAudit, (audit) => audit.lines, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'inventory_audit_id' })
  inventory_audit: InventoryAudit;

  @Column()
  inventory_audit_id: string;

  @ManyToOne(() => InventoryBatch, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'inventory_batch_id' })
  inventory_batch: InventoryBatch;

  @Column()
  inventory_batch_id: string;

  /** Existencia del sistema al crear la línea (snapshot) */
  @Column({ type: 'decimal', precision: 12, scale: 3 })
  system_quantity: number;

  /** Cantidad física contada. Null hasta que se captura. */
  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  counted_quantity: number | null;

  /** counted - system. Null si aún no se contó. */
  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  variance: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string | null;

  /** true si el lote se agregó después del snapshot inicial */
  @Column({ type: 'tinyint', default: 0 })
  is_additional: boolean;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'counted_by' })
  counted_by_user: User | null;

  @Column({ nullable: true })
  counted_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  counted_at: Date | null;

  /** Existencia real del lote al momento de autorizar (puede diferir del snapshot) */
  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  quantity_before_post: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  quantity_after_post: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
