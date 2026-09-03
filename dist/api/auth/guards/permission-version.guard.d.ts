import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionVersionService } from '../../rbac/services/permission-version.service';
export declare class PermissionVersionGuard implements CanActivate {
    private readonly permissionVersionService;
    private readonly reflector;
    private readonly logger;
    constructor(permissionVersionService: PermissionVersionService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
