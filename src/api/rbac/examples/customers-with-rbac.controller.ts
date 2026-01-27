/**
 * Example of the CustomersController updated to use RBAC permissions
 * This demonstrates how to integrate PermissionGuard with existing controllers
 */

import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import {
  RequireCustomerRead,
  RequireCustomerCreate,
  RequireCustomerUpdate,
  RequirePermissions,
} from '../decorators/require-permissions.decorator';

// Mock DTOs for demonstration
interface CreateCustomerDto {
  name: string;
  email: string;
}

interface UpdateCustomerDto {
  name?: string;
  email?: string;
}

/**
 * Updated CustomersController with RBAC protection
 * 
 * Key changes from original:
 * 1. Added PermissionGuard to @UseGuards
 * 2. Added permission decorators to each method
 * 3. Tenant context is now automatically managed by the guard
 */
@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionGuard) // Apply both JWT auth and permission checking
export class CustomersWithRBACController {

  /**
   * Create a new customer
   * Requires Customer:Create permission
   */
  @Post()
  @RequireCustomerCreate()
  create(@Body() dto: CreateCustomerDto, @Req() req) {
    // The guard has already:
    // 1. Verified the user is authenticated
    // 2. Checked they have Customer:Create permission
    // 3. Set the tenant context
    
    // You can still access tenant_id from the request if needed
    const tenantId = req.user.tenant_id;
    
    return {
      message: 'Customer created successfully',
      tenantId,
      data: dto,
    };
  }

  /**
   * Update an existing customer
   * Requires both Customer:Update and Customer:Read permissions
   */
  @Put(':id')
  @RequirePermissions(
    { entityType: 'Customer', action: 'Update' },
    { entityType: 'Customer', action: 'Read' } // Also need read to verify customer exists
  )
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @Req() req) {
    // User has been verified to have both Update and Read permissions
    const tenantId = req.user.tenant_id;
    
    return {
      message: `Customer ${id} updated successfully`,
      tenantId,
      data: dto,
    };
  }

  /**
   * Get all customers
   * Requires Customer:Read permission
   */
  @Get()
  @RequireCustomerRead()
  findAll(@Req() req) {
    // User has been verified to have Customer:Read permission
    const tenantId = req.user.tenant_id;
    
    return {
      message: 'Customers retrieved successfully',
      tenantId,
      data: [], // Mock data
    };
  }

  /**
   * Get a specific customer
   * Requires Customer:Read permission
   */
  @Get(':id')
  @RequireCustomerRead()
  findOne(@Param('id') id: string, @Req() req) {
    // User has been verified to have Customer:Read permission
    const tenantId = req.user.tenant_id;
    
    return {
      message: `Customer ${id} retrieved successfully`,
      tenantId,
      data: { id, name: 'Mock Customer' }, // Mock data
    };
  }
}

/**
 * Comparison with original controller:
 * 
 * BEFORE (original):
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Controller('customers')
 * export class CustomersController {
 *   @Post()
 *   create(@Body() dto: CreateCustomerDto, @Req() req) {
 *     return this.customersService.create(dto, req.user.tenant_id);
 *   }
 * }
 * ```
 * 
 * AFTER (with RBAC):
 * ```typescript
 * @UseGuards(JwtAuthGuard, PermissionGuard)
 * @Controller('customers')
 * export class CustomersController {
 *   @Post()
 *   @RequireCustomerCreate()
 *   create(@Body() dto: CreateCustomerDto, @Req() req) {
 *     return this.customersService.create(dto, req.user.tenant_id);
 *   }
 * }
 * ```
 * 
 * Benefits of the RBAC approach:
 * 1. Declarative permission requirements
 * 2. Automatic permission checking before method execution
 * 3. Consistent error handling and logging
 * 4. Tenant context management
 * 5. Performance optimization through caching
 * 6. Security audit trail
 */