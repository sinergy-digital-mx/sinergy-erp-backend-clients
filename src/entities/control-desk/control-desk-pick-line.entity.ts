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
import { Warehouse } from '../warehouse/warehouse.entity';
import { SalesOrderDetail } from '../sales-orders/sales-order-detail.entity';
import { ControlDeskPickTask } from './control-desk-pick-task.entity';
import type { ControlDeskLineStatus } from './control-desk.constants';

@Entity('control_desk_pick_lines')
@Index('idx_cd_lines_tenant', ['tenant_id'])
@Index('idx_cd_lines_task', ['task_id'])
@Index('idx_cd_lines_detail', ['sales_order_detail_id'])
export class ControlDeskPickLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => ControlDeskPickTask, (task) => task.lines, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'task_id' })
  task: ControlDeskPickTask;

  @Column()
  task_id: string;

  @ManyToOne(() => SalesOrderDetail, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'sales_order_detail_id' })
  sales_order_detail: SalesOrderDetail;

  @Column()
  sales_order_detail_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity_base_requested: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantity_base_picked: number;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: ControlDeskLineStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
