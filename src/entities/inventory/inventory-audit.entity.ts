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
import { Warehouse } from '../warehouse/warehouse.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { InventoryAuditStatus } from './inventory-audit-status.enum';
import { InventoryAuditLine } from './inventory-audit-line.entity';

@Entity('inv_s_inventory_audits')
@Index('idx_audit_tenant', ['tenant_id'])
@Index('idx_audit_folio', ['tenant_id', 'folio'], { unique: true })
@Index('idx_audit_warehouse', ['warehouse_id'])
@Index('idx_audit_status', ['tenant_id', 'status'])
@Index('idx_audit_created_at', ['created_at'])
export class InventoryAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column({ length: 20 })
  folio: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  /** Si se indica, el conteo cubre solo lotes de ese producto */
  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;

  @Column({ nullable: true })
  product_id: string | null;

  @Column({ type: 'tinyint', default: 0 })
  include_empty_lots: boolean;

  @Column({
    type: 'enum',
    enum: InventoryAuditStatus,
    default: InventoryAuditStatus.DRAFT,
  })
  status: InventoryAuditStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

  @Column()
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'submitted_by' })
  submitted_by_user: User | null;

  @Column({ nullable: true })
  submitted_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  submitted_at: Date | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'authorized_by' })
  authorized_by_user: User | null;

  @Column({ nullable: true })
  authorized_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  authorized_at: Date | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'rejected_by' })
  rejected_by_user: User | null;

  @Column({ nullable: true })
  rejected_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  rejected_at: Date | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'cancelled_by' })
  cancelled_by_user: User | null;

  @Column({ nullable: true })
  cancelled_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date | null;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string | null;

  @OneToMany(() => InventoryAuditLine, (line) => line.inventory_audit)
  lines: InventoryAuditLine[];
}
