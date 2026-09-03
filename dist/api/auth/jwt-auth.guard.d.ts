import { ExecutionContext } from '@nestjs/common';
import { PermissionVersionService } from '../rbac/services/permission-version.service';
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
    private readonly permissionVersionService?;
    private readonly logger;
    constructor(permissionVersionService?: PermissionVersionService | undefined);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export {};
