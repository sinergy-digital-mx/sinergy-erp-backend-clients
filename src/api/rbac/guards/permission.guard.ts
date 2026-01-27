import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../services/permission.service';
import { TenantContextService } from '../services/tenant-context.service';
import { PERMISSIONS_KEY, RequiredPermission } from '../decorators/require-permissions.decorator';
import { RBACErrorUtils } from '../errors/error-utils';
import { RBACErrorCode } from '../errors/rbac-error.types';

/**
 * Guard that checks if the authenticated user has the required permissions
 * to access a protected route. Integrates with JWT authentication and
 * the RBAC permission system.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
    private tenantContextService: TenantContextService,
  ) {}

  /**
   * Determines if the current request should be allowed to proceed
   * @param context - The execution context containing request information
   * @returns Promise<boolean> - True if access is granted, false otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator metadata
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      this.logger.debug('No permissions required for this route');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Ensure user is authenticated (should be handled by JwtAuthGuard first)
    if (!user) {
      this.logger.warn('No user found in request - authentication required');
      RBACErrorUtils.throwAuthenticationRequired('Authentication required');
    }

    // Extract tenant ID from various sources
    const tenantId = this.extractTenantId(request, user);

    if (!tenantId) {
      this.logger.warn(`No tenant ID found for user ${user.user_id}`);
      RBACErrorUtils.throwAuthenticationRequired('Tenant context is required');
    }

    // Set tenant context for this request
    this.tenantContextService.setTenantContext(tenantId, user.user_id);

    this.logger.debug(
      `Checking permissions for user ${user.user_id} in tenant ${tenantId}: ${requiredPermissions
        .map(p => `${p.entityType}:${p.action}`)
        .join(', ')}`,
    );

    // Check each required permission
    for (const permission of requiredPermissions) {
      try {
        const hasPermission = await this.permissionService.hasPermission(
          user.user_id,
          tenantId,
          permission.entityType,
          permission.action,
        );

        if (!hasPermission) {
          this.logger.warn(
            `Permission denied for user ${user.user_id} in tenant ${tenantId}: missing ${permission.entityType}:${permission.action}`,
          );
          
          RBACErrorUtils.throwPermissionDenied(
            permission.entityType,
            permission.action,
            user.user_id,
            tenantId,
          );
        }

        this.logger.debug(
          `Permission granted for user ${user.user_id}: ${permission.entityType}:${permission.action}`,
        );
      } catch (error) {
        // If it's already an RBAC exception, re-throw it
        if (RBACErrorUtils.isRBACException(error)) {
          throw error;
        }

        // Log unexpected errors and convert to appropriate exception
        this.logger.error(
          `Error checking permission ${permission.entityType}:${permission.action} for user ${user.user_id}:`,
          error,
        );

        // If it's a validation error (like invalid entity type), it should already be an RBAC exception
        // For other errors, return system error
        RBACErrorUtils.throwSystemError(
          'PermissionGuard',
          'canActivate',
          error as Error,
        );
      }
    }

    this.logger.debug(
      `All permissions granted for user ${user.user_id} in tenant ${tenantId}`,
    );

    return true;
  }

  /**
   * Extract tenant ID from request headers, JWT payload, or user object
   * @param request - The HTTP request object
   * @param user - The authenticated user object from JWT
   * @returns string | null - The tenant ID if found
   */
  private extractTenantId(request: any, user: any): string | null {
    // Priority order for tenant ID extraction:
    // 1. X-Tenant-ID header (allows tenant switching)
    // 2. JWT payload tenant_id
    // 3. User object currentTenantId or tenant_id

    // Check X-Tenant-ID header first (case-insensitive)
    const headerTenantId = 
      request.headers['x-tenant-id'] || 
      request.headers['X-Tenant-ID'] ||
      request.headers['X-TENANT-ID'];

    if (headerTenantId) {
      this.logger.debug(`Tenant ID from header: ${headerTenantId}`);
      return headerTenantId;
    }

    // Check JWT payload
    if (user.tenant_id) {
      this.logger.debug(`Tenant ID from JWT: ${user.tenant_id}`);
      return user.tenant_id;
    }

    // Check user object for alternative property names
    if (user.currentTenantId) {
      this.logger.debug(`Tenant ID from user.currentTenantId: ${user.currentTenantId}`);
      return user.currentTenantId;
    }

    this.logger.debug('No tenant ID found in request headers or JWT payload');
    return null;
  }

  /**
   * Validate that the user has access to the specified tenant
   * This is an additional security check to prevent cross-tenant access
   * @param userId - The user ID
   * @param tenantId - The tenant ID to validate
   * @returns Promise<boolean> - True if user has access to tenant
   */
  private async validateUserTenantAccess(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    try {
      return await this.permissionService.validateUserTenantAccess(userId, tenantId);
    } catch (error) {
      this.logger.error(
        `Error validating tenant access for user ${userId} to tenant ${tenantId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Enhanced permission check with tenant access validation
   * @param context - The execution context
   * @returns Promise<boolean> - True if access is granted
   */
  async canActivateWithTenantValidation(context: ExecutionContext): Promise<boolean> {
    // First run the standard permission check
    const hasPermissions = await this.canActivate(context);
    
    if (!hasPermissions) {
      return false;
    }

    // Additional tenant access validation
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = this.extractTenantId(request, user);

    if (tenantId && user?.user_id) {
      const hasAccess = await this.validateUserTenantAccess(user.user_id, tenantId);
      
      if (!hasAccess) {
        this.logger.warn(
          `User ${user.user_id} does not have access to tenant ${tenantId}`,
        );
        RBACErrorUtils.throwCrossTenantAccessDenied(tenantId, user.currentTenantId || 'unknown', user.user_id);
      }
    }

    return true;
  }
}