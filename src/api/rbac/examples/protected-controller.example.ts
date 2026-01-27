/**
 * Example demonstrating how to use PermissionGuard and RequirePermissions decorator
 * to protect controller routes with RBAC permissions.
 * 
 * This file shows various patterns for protecting routes with different permission requirements.
 */

import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import {
  RequirePermissions,
  RequirePermission,
  RequireCustomerRead,
  RequireCustomerCreate,
  RequireCustomerUpdate,
  RequireCustomerDelete,
  RequireAdmin,
  RequireReadOnly,
} from '../decorators/require-permissions.decorator';

/**
 * Example controller showing different ways to protect routes with permissions
 */
@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionGuard) // Apply both JWT auth and permission checking
export class ProtectedCustomersController {

  /**
   * Basic permission requirement - single permission
   */
  @Get()
  @RequireCustomerRead() // Convenience decorator for Customer:Read
  async findAll(@Req() req) {
    // Only users with Customer:Read permission can access this endpoint
    return { message: 'Customer list', tenantId: req.user.tenant_id };
  }

  /**
   * Alternative syntax using RequirePermission
   */
  @Get(':id')
  @RequirePermission('Customer', 'Read')
  async findOne(@Param('id') id: string, @Req() req) {
    // Same as above but using the generic RequirePermission decorator
    return { message: `Customer ${id}`, tenantId: req.user.tenant_id };
  }

  /**
   * Create operation with specific permission
   */
  @Post()
  @RequireCustomerCreate()
  async create(@Body() createDto: any, @Req() req) {
    // Only users with Customer:Create permission can access this endpoint
    return { message: 'Customer created', tenantId: req.user.tenant_id };
  }

  /**
   * Update operation requiring multiple permissions
   */
  @Put(':id')
  @RequirePermissions(
    { entityType: 'Customer', action: 'Update' },
    { entityType: 'Customer', action: 'Read' } // Also need read to verify customer exists
  )
  async update(@Param('id') id: string, @Body() updateDto: any, @Req() req) {
    // Users need BOTH Customer:Update AND Customer:Read permissions
    return { message: `Customer ${id} updated`, tenantId: req.user.tenant_id };
  }

  /**
   * Delete operation with strict permission
   */
  @Delete(':id')
  @RequireCustomerDelete()
  async remove(@Param('id') id: string, @Req() req) {
    // Only users with Customer:Delete permission can access this endpoint
    return { message: `Customer ${id} deleted`, tenantId: req.user.tenant_id };
  }

  /**
   * Admin-only operation
   */
  @Post('bulk-import')
  @RequireAdmin() // Requires multiple User management permissions
  async bulkImport(@Body() importData: any, @Req() req) {
    // Only admin users can perform bulk operations
    return { message: 'Bulk import completed', tenantId: req.user.tenant_id };
  }

  /**
   * Export operation with custom permission
   */
  @Get('export')
  @RequirePermission('Customer', 'Export')
  async exportCustomers(@Req() req) {
    // Uses a custom Export action
    return { message: 'Customer export', tenantId: req.user.tenant_id };
  }

  /**
   * Read-only access to multiple entity types
   */
  @Get('dashboard')
  @RequireReadOnly('Customer', 'Lead', 'Order')
  async getDashboard(@Req() req) {
    // Requires read access to Customer, Lead, and Order entities
    return { message: 'Dashboard data', tenantId: req.user.tenant_id };
  }
}

/**
 * Example of controller-level permissions
 * All methods in this controller require User:Read permission unless overridden
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('User', 'Read') // Applied to all methods
export class AdminController {

  @Get('users')
  // Inherits User:Read from controller level
  async getUsers(@Req() req) {
    return { message: 'User list', tenantId: req.user.tenant_id };
  }

  @Post('users')
  @RequirePermission('User', 'Create') // Overrides controller-level permission
  async createUser(@Body() createDto: any, @Req() req) {
    // This method requires User:Create instead of User:Read
    return { message: 'User created', tenantId: req.user.tenant_id };
  }

  @Delete('users/:id')
  @RequirePermissions(
    { entityType: 'User', action: 'Delete' },
    { entityType: 'User', action: 'Read' } // Combines with controller-level permission
  )
  async deleteUser(@Param('id') id: string, @Req() req) {
    // This method requires both User:Delete and User:Read
    return { message: `User ${id} deleted`, tenantId: req.user.tenant_id };
  }
}

/**
 * Example of a public controller with selective protection
 */
@Controller('public')
@UseGuards(JwtAuthGuard) // Only JWT auth, no blanket permission requirements
export class MixedAccessController {

  @Get('info')
  // No permission decorator = no permission check (but still requires JWT auth)
  async getPublicInfo() {
    return { message: 'Public information' };
  }

  @Get('protected')
  @UseGuards(PermissionGuard) // Apply permission guard to specific method
  @RequirePermission('System', 'Read')
  async getProtectedInfo(@Req() req) {
    // This specific method requires System:Read permission
    return { message: 'Protected information', tenantId: req.user.tenant_id };
  }
}

/**
 * Usage Notes:
 * 
 * 1. Always use JwtAuthGuard before PermissionGuard to ensure user is authenticated
 * 2. PermissionGuard automatically extracts tenant context from:
 *    - X-Tenant-ID header (highest priority)
 *    - JWT payload tenant_id field
 *    - User object properties
 * 
 * 3. Multiple permissions in @RequirePermissions are AND-ed (all must be satisfied)
 * 
 * 4. Controller-level permissions apply to all methods unless overridden
 * 
 * 5. The guard automatically sets tenant context for the request, making it available
 *    to services via TenantContextService
 * 
 * 6. Permission checks are cached for performance - see PermissionCacheService
 * 
 * 7. All permission checks are logged for security auditing
 */