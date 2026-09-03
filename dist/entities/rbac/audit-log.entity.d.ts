import { RBACTenant } from './tenant.entity';
export declare enum AuditAction {
    PERMISSION_GRANTED = "permission_granted",
    PERMISSION_REVOKED = "permission_revoked",
    ROLE_ASSIGNED = "role_assigned",
    ROLE_UNASSIGNED = "role_unassigned",
    ROLE_CREATED = "role_created",
    ROLE_UPDATED = "role_updated",
    ROLE_DELETED = "role_deleted",
    PERMISSION_CREATED = "permission_created",
    PERMISSION_UPDATED = "permission_updated",
    PERMISSION_DELETED = "permission_deleted",
    ACCESS_GRANTED = "access_granted",
    ACCESS_DENIED = "access_denied",
    TENANT_CREATED = "tenant_created",
    TENANT_UPDATED = "tenant_updated",
    TENANT_DELETED = "tenant_deleted"
}
export declare enum AuditResult {
    SUCCESS = "success",
    FAILURE = "failure",
    ERROR = "error"
}
export declare class AuditLog {
    id: string;
    action: AuditAction;
    result: AuditResult;
    userId: string;
    actorId: string;
    tenant: RBACTenant;
    tenantId: string;
    resourceType: string;
    resourceId: string;
    entityType: string;
    permissionAction: string;
    roleId: string;
    permissionId: string;
    details: string;
    errorMessage: string;
    ipAddress: string;
    userAgent: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
