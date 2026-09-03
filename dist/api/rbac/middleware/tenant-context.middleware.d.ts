import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from '../services/tenant-context.service';
export declare class TenantContextMiddleware implements NestMiddleware {
    private readonly tenantContextService;
    constructor(tenantContextService: TenantContextService);
    use(req: Request, res: Response, next: NextFunction): void;
}
