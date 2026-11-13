import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';

@Entity('employee_overtime_policies')
@Index('IDX_employee_overtime_policies_tenant', ['tenant_id'], { unique: true })
export class EmployeeOvertimePolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ name: 'tenant_id' })
  tenant_id: string;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 8 })
  workday_hours: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 3 })
  daily_double_hours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 9 })
  weekly_double_hours: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 2 })
  double_multiplier: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 3 })
  excess_multiplier: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
