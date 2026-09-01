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
import { User } from '../users/user.entity';
import { ControlDeskJob } from './control-desk-job.entity';
import { ControlDeskPickLine } from './control-desk-pick-line.entity';
import type { ControlDeskTaskStatus } from './control-desk.constants';

@Entity('control_desk_pick_tasks')
@Index('idx_cd_tasks_tenant', ['tenant_id'])
@Index('idx_cd_tasks_job', ['job_id'])
@Index('idx_cd_tasks_warehouse', ['tenant_id', 'warehouse_id', 'status'])
@Index('uq_cd_tasks_job_warehouse', ['job_id', 'warehouse_id'], { unique: true })
export class ControlDeskPickTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => ControlDeskJob, (job) => job.tasks, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'job_id' })
  job: ControlDeskJob;

  @Column()
  job_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: ControlDeskTaskStatus;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'started_by' })
  starter: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  started_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'completed_by' })
  completer: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  completed_by: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => ControlDeskPickLine, (line) => line.task)
  lines: ControlDeskPickLine[];
}
