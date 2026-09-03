import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../services/permission.service';
import { TenantContextService } from '../services/tenant-context.service';
export declare class PermissionGuard implements CanActivate {
    private reflector;
    private permissionService;
    private tenantContextService;
    private readonly logger;
    constructor(reflector: Reflector, permissionService: PermissionService, tenantContextService: TenantContextService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTenantId;
    private validateUserTenantAccess;
    canActivateWithTenantValidation(context: ExecutionContext): Promise<boolean>;
}
