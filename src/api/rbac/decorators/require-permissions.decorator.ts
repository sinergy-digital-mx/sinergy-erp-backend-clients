import { SetMetadata } from '@nestjs/common';

/**
 * Interface defining a required permission for route access
 */
export interface RequiredPermission {
  /** The entity type (e.g., 'Customer', 'Lead', 'User') */
  entityType: string;
  /** The action (e.g., 'Create', 'Read', 'Update', 'Delete') */
  action: string;
}

/**
 * Metadata key for storing required permissions
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for a route or controller
 * 
 * @param permissions - Array of required permissions
 * @returns Decorator function
 * 
 * @example
 * ```typescript
 * @Controller('customers')
 * @UseGuards(JwtAuthGuard, PermissionGuard)
 * export class CustomersController {
 *   @Get()
 *   @RequirePermissions({ entityType: 'Customer', action: 'Read' })
 *   async findAll() {
 *     // Only users with Customer:Read permission can access this
 *   }
 * 
 *   @Post()
 *   @RequirePermissions({ entityType: 'Customer', action: 'Create' })
 *   async create(@Body() createCustomerDto: CreateCustomerDto) {
 *     // Only users with Customer:Create permission can access this
 *   }
 * 
 *   @Delete(':id')
 *   @RequirePermissions(
 *     { entityType: 'Customer', action: 'Delete' },
 *     { entityType: 'Customer', action: 'Read' }
 *   )
 *   async remove(@Param('id') id: string) {
 *     // Users need both Customer:Delete AND Customer:Read permissions
 *   }
 * }
 * ```
 */
export const RequirePermissions = (
  ...permissions: RequiredPermission[]
) => SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Convenience decorator for single permission requirement
 * 
 * @param entityType - The entity type
 * @param action - The action
 * @returns Decorator function
 * 
 * @example
 * ```typescript
 * @Get()
 * @RequirePermission('Customer', 'Read')
 * async findAll() {
 *   // Only users with Customer:Read permission can access this
 * }
 * ```
 */
export const RequirePermission = (entityType: string, action: string) =>
  RequirePermissions({ entityType, action });

/**
 * Convenience decorators for common CRUD operations
 */
export const RequireCreate = (entityType: string) =>
  RequirePermission(entityType, 'Create');

export const RequireRead = (entityType: string) =>
  RequirePermission(entityType, 'Read');

export const RequireUpdate = (entityType: string) =>
  RequirePermission(entityType, 'Update');

export const RequireDelete = (entityType: string) =>
  RequirePermission(entityType, 'Delete');

/**
 * Convenience decorators for common entity types
 */
export const RequireCustomerRead = () => RequireRead('Customer');
export const RequireCustomerCreate = () => RequireCreate('Customer');
export const RequireCustomerUpdate = () => RequireUpdate('Customer');
export const RequireCustomerDelete = () => RequireDelete('Customer');

export const RequireLeadRead = () => RequireRead('Lead');
export const RequireLeadCreate = () => RequireCreate('Lead');
export const RequireLeadUpdate = () => RequireUpdate('Lead');
export const RequireLeadDelete = () => RequireDelete('Lead');

export const RequireUserRead = () => RequireRead('User');
export const RequireUserCreate = () => RequireCreate('User');
export const RequireUserUpdate = () => RequireUpdate('User');
export const RequireUserDelete = () => RequireDelete('User');

/**
 * Decorator for admin-only access (requires User management permissions)
 */
export const RequireAdmin = () => RequirePermissions(
  { entityType: 'User', action: 'Create' },
  { entityType: 'User', action: 'Update' },
  { entityType: 'User', action: 'Delete' }
);

/**
 * Decorator for read-only access to multiple entities
 */
export const RequireReadOnly = (...entityTypes: string[]) =>
  RequirePermissions(...entityTypes.map(entityType => ({ entityType, action: 'Read' })));

/**
 * Decorator for full CRUD access to an entity
 */
export const RequireFullAccess = (entityType: string) =>
  RequirePermissions(
    { entityType, action: 'Create' },
    { entityType, action: 'Read' },
    { entityType, action: 'Update' },
    { entityType, action: 'Delete' }
  );

/**
 * Decorator for Ver_Menu permission
 * This permission controls sidebar visibility for modules
 * 
 * @param entityType - The entity/module type (e.g., 'customers', 'leads', 'vendors')
 * @returns Decorator function
 * 
 * @example
 * ```typescript
 * @Get('menu-items')
 * @RequireVerMenu('customers')
 * async getCustomerMenuItems() {
 *   // Only users with customers:Ver_Menu permission can access this
 * }
 * ```
 */
export const RequireVerMenu = (entityType: string) =>
  RequirePermission(entityType, 'Ver_Menu');

/**
 * Convenience decorators for Ver_Menu permission on common modules
 */
export const RequireCustomerMenu = () => RequireVerMenu('customers');
export const RequireLeadMenu = () => RequireVerMenu('leads');
export const RequireVendorMenu = () => RequireVerMenu('vendors');
export const RequireProductMenu = () => RequireVerMenu('products');
export const RequireWarehouseMenu = () => RequireVerMenu('warehouse');
export const RequireContractMenu = () => RequireVerMenu('contracts');
export const RequireActivityMenu = () => RequireVerMenu('activities');
export const RequireReportMenu = () => RequireVerMenu('reports');