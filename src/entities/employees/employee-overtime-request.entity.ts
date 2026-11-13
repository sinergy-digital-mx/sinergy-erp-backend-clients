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
import { Employee } from './employee.entity';
import { OvertimeStatus } from './overtime-status.enum';

@Entity('employee_overtime_requests')
@Index('IDX_employee_overtime_requests_tenant', ['tenant_id'])
@Index('IDX_employee_overtime_requests_employee', ['employee_id'])
@Index('IDX_employee_overtime_requests_status', ['status'])
@Index('IDX_employee_overtime_requests_employee_date', ['employee_id', 'work_date'])
export class EmployeeOvertimeRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ name: 'tenant_id' })
  tenant_id: string;

  @ManyToOne(() => Employee, (employee) => employee.overtime_requests, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id' })
  employee_id: string;

  @Column({ type: 'date' })
  work_date: string;

  @Column({ type: 'varchar', length: 5 })
  start_time: string;

  @Column({ type: 'varchar', length: 5 })
  end_time: string;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  requested_hours: number;

  @Column({ type: 'varchar', length: 500 })
  reason: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @Column({
    type: 'enum',
    enum: OvertimeStatus,
    default: OvertimeStatus.PENDING,
  })
  status: OvertimeStatus;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  approved_hours: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  hourly_rate: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  double_hours: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  excess_hours: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  paid_amount: number | null;

  @Column({ type: 'json', nullable: true })
  payment_detail: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  reviewed_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  review_notes: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  paid_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
