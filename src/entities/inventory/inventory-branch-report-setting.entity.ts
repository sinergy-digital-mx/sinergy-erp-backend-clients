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
import { User } from '../users/user.entity';

/** Sucursales visibles en el reporte Por sucursal. Una fila por organización. */
@Entity('inventory_branch_report_settings')
@Index('uq_inventory_branch_report_settings_tenant', ['tenant_id'], { unique: true })
export class InventoryBranchReportSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  /** Ids de sucursales que salen en el reporte. */
  @Column({ type: 'json' })
  visible_branch_ids: string[];

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  updated_by: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
