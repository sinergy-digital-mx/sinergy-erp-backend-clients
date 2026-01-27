import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from '../services/tenant-context.service';

/**
 * Middleware to extract and set tenant context from request headers or JWT payload.
 * Supports both header-based tenant switching and JWT-embedded tenant information.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContextService: TenantContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant ID from headers (for tenant switching)
    const headerTenantId = req.headers['x-tenant-id'] as string;
    
    // Extract user information from JWT payload (set by JWT strategy)
    const user = (req as any).user;
    
    if (user) {
      // User is authenticated via JWT
      const jwtTenantId = user.tenant_id;
      const userId = user.user_id;
      
      // Determine which tenant ID to use
      let effectiveTenantId: string;
      
      if (headerTenantId) {
        // Header tenant ID provided - validate user has access to this tenant
        // For now, we'll use the header tenant ID and validate later in guards
        effectiveTenantId = headerTenantId;
      } else {
        // Use tenant from JWT
        effectiveTenantId = jwtTenantId;
      }
      
      if (!effectiveTenantId) {
        throw new UnauthorizedException('Tenant context is required');
      }
      
      // Set tenant context for this request
      this.tenantContextService.setTenantContext(effectiveTenantId, userId);
    } else if (headerTenantId) {
      // No authenticated user but tenant header provided
      // This might be valid for some public endpoints, so we'll set the tenant context
      // but leave user ID as null
      this.tenantContextService.setTenantContext(headerTenantId, null);
    }
    
    next();
  }
}