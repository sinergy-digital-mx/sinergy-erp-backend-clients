import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { EmployeeLeaveRequest } from './employee-leave-request.entity';

@Entity('employee_leave_documents')
@Index('IDX_employee_leave_documents_tenant', ['tenant_id'])
@Index('IDX_employee_leave_documents_request', ['leave_request_id'])
export class EmployeeLeaveDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ name: 'tenant_id' })
  tenant_id: string;

  @ManyToOne(() => EmployeeLeaveRequest, (request) => request.documents, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'leave_request_id' })
  leave_request: EmployeeLeaveRequest;

  @Column({ name: 'leave_request_id' })
  leave_request_id: string;

  @Column({ name: 'employee_id' })
  employee_id: string;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 500 })
  s3_key: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  mime_type: string | null;

  @Column({ type: 'int', nullable: true })
  file_size: number | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  uploaded_by: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
