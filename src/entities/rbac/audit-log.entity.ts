import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RBACTenant } from './tenant.entity';

export enum AuditAction {
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_REVOKED = 'permission_revoked',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_UNASSIGNED = 'role_unassigned',
  ROLE_CREATED = 'role_created',
  ROLE_UPDATED = 'role_updated',
  ROLE_DELETED = 'role_deleted',
  PERMISSION_CREATED = 'permission_created',
  PERMISSION_UPDATED = 'permission_updated',
  PERMISSION_DELETED = 'permission_deleted',
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  TENANT_CREATED = 'tenant_created',
  TENANT_UPDATED = 'tenant_updated',
  TENANT_DELETED = 'tenant_deleted',
}

export enum AuditResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  ERROR = 'error',
}

@Entity('audit_logs')
@Index(['tenantId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['result', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditResult,
  })
  result: AuditResult;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'actor_id', nullable: true })
  actorId: string;

  @ManyToOne(() => RBACTenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId: string;

  @Column({ name: 'resource_type', nullable: true })
  resourceType: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ name: 'entity_type', nullable: true })
  entityType: string;

  @Column({ name: 'permission_action', nullable: true })
  permissionAction: string;

  @Column({ name: 'role_id', nullable: true })
  roleId: string;

  @Column({ name: 'permission_id', nullable: true })
  permissionId: string;

  @Column({ type: 'text', nullable: true })
  details: string;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}