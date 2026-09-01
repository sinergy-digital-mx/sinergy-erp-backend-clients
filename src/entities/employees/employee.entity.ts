// src/entities/employees/employee.entity.ts
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
import { User } from '../users/user.entity';
import { EmployeeStatus } from './employee-status.enum';
import { EmployeePaymentFrequency } from './employee-payment-frequency.enum';
import { EmployeeLeaveRequest } from './employee-leave-request.entity';

@Entity('employees')
@Index('IDX_employees_tenant', ['tenant_id'])
@Index('IDX_employees_user', ['user_id'], { unique: true })
@Index('IDX_employees_status', ['status'])
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ name: 'tenant_id' })
  tenant_id: string;

  // Relación 1:1 con el usuario del sistema.
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  user_id: string;

  // Código interno de empleado (opcional).
  @Column({ type: 'varchar', length: 50, nullable: true })
  employee_code: string | null;

  // Datos fiscales / seguridad social.
  @Column({ type: 'varchar', length: 13, nullable: true })
  rfc: string | null;

  @Column({ type: 'varchar', length: 18, nullable: true })
  curp: string | null;

  // Número de Seguridad Social (IMSS).
  @Column({ type: 'varchar', length: 20, nullable: true })
  nss: string | null;

  // Puesto y área.
  @Column({ type: 'varchar', length: 150, nullable: true })
  position: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  department: string | null;

  // Fecha de ingreso: base para calcular antigüedad y vacaciones.
  @Column({ type: 'date', nullable: true })
  hire_date: string | null;

  // Días extra o no tomados del periodo anterior. RH los captura a mano.
  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  vacation_carryover_days: number;

  @Column({ type: 'date', nullable: true })
  birth_date: string | null;

  // Nómina.
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  monthly_salary: number | null;

  @Column({
    type: 'enum',
    enum: EmployeePaymentFrequency,
    default: EmployeePaymentFrequency.BIWEEKLY,
  })
  payment_frequency: EmployeePaymentFrequency;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_name: string | null;

  @Column({ type: 'varchar', length: 18, nullable: true })
  clabe: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  bank_account: string | null;

  // Foto del empleado (S3 key). Se sirve como URL firmada.
  @Column({ type: 'varchar', length: 500, nullable: true })
  photo_s3_key: string | null;

  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
  })
  status: EmployeeStatus;

  @Column({ type: 'date', nullable: true })
  termination_date: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;

  @OneToMany(() => EmployeeLeaveRequest, (request) => request.employee)
  leave_requests: EmployeeLeaveRequest[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
