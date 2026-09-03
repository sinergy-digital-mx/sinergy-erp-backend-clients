import { RBACErrorCode, RBACErrorCategory, RBACErrorSeverity } from './rbac-error.types';
export interface RBACErrorResponse {
    statusCode: number;
    error: string;
    message: string;
    code: RBACErrorCode;
    category: RBACErrorCategory;
    severity: RBACErrorSeverity;
    details?: {
        requiredPermission?: {
            entityType: string;
            action: string;
        };
        userPermissions?: string[];
        tenantId?: string;
        userId?: string;
        roleInfo?: {
            roleId?: string;
            roleName?: string;
            conflictingRoles?: string[];
        };
        validationErrors?: Array<{
            field: string;
            message: string;
            value?: any;
        }>;
        systemContext?: {
            service?: string;
            operation?: string;
            correlationId?: string;
        };
    };
    suggestions?: string[];
    timestamp: string;
    path: string;
    correlationId?: string;
}
export interface RBACSimpleErrorResponse {
    statusCode: number;
    error: string;
    message: string;
    timestamp: string;
    path: string;
}
export interface RBACDebugErrorResponse extends RBACErrorResponse {
    stackTrace?: string;
    requestDetails?: {
        method: string;
        headers: Record<string, string>;
        query: Record<string, any>;
        body?: any;
    };
    internalError?: {
        originalError?: string;
        service?: string;
        operation?: string;
    };
}
