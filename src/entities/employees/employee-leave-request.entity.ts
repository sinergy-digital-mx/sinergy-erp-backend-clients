// src/entities/employees/employee-leave-request.entity.ts
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
import { Employee } from './employee.entity';
import { LeaveType } from './leave-type.enum';
import { LeaveStatus } from './leave-status.enum';

@Entity('employee_leave_requests')
@Index('IDX_employee_leave_requests_tenant', ['tenant_id'])
@Index('IDX_employee_leave_requests_employee', ['employee_id'])
@Index('IDX_employee_leave_requests_status', ['status'])
export class EmployeeLeaveRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ name: 'tenant_id' })
  tenant_id: string;

  @ManyToOne(() => Employee, (employee) => employee.leave_requests, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id' })
  employee_id: string;

  @Column({ type: 'enum', enum: LeaveType })
  type: LeaveType;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  // Días solicitados (permite medios días).
  @Column({ type: 'decimal', precision: 5, scale: 1 })
  days: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string | null;

  @Column({ type: 'enum', enum: LeaveStatus, default: LeaveStatus.PENDING })
  status: LeaveStatus;

  // Indica si la ausencia es con goce de sueldo.
  @Column({ type: 'tinyint', default: 1 })
  is_paid: boolean;

  // Auditoría de creación y revisión.
  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  reviewed_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  review_notes: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
