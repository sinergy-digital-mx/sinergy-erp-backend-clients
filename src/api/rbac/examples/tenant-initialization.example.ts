import { Injectable, Logger } from '@nestjs/common';
import { TenantService, TenantCreationOptions } from '../services/tenant.service';

/**
 * Example service demonstrating tenant initialization with automatic role creation
 * 
 * This example shows how to:
 * 1. Create tenants with automatic system role initialization
 * 2. Create tenants with custom role templates
 * 3. Initialize roles for existing tenants
 * 4. Handle tenant creation with configuration
 */
@Injectable()
export class TenantInitializationExample {
  private readonly logger = new Logger(TenantInitializationExample.name);

  constructor(private readonly tenantService: TenantService) {}

  /**
   * Example 1: Create a basic tenant with system roles
   */
  async createBasicTenant(): Promise<void> {
    this.logger.log('Creating basic tenant with system roles');

    try {
      const options: TenantCreationOptions = {
        name: 'Acme Corporation',
        subdomain: 'acme-corp',
        isActive: true,
      };

      const result = await this.tenantService.createTenant(options);

      this.logger.log(`Tenant created successfully:`);
      this.logger.log(`- Tenant ID: ${result.tenant.id}`);
      this.logger.log(`- Name: ${result.tenant.name}`);
      this.logger.log(`- Subdomain: ${result.tenant.subdomain}`);
      this.logger.log(`- System Roles Created: ${result.systemRoles.totalRoles}`);
      this.logger.log(`- Total Permissions: ${result.systemRoles.totalPermissions}`);

      if (result.warnings.length > 0) {
        this.logger.warn('Warnings during tenant creation:');
        result.warnings.forEach(warning => this.logger.warn(`- ${warning}`));
      }

      if (result.systemRoles.errors.length > 0) {
        this.logger.error('Errors during system role creation:');
        result.systemRoles.errors.forEach(error => this.logger.error(`- ${error}`));
      }
    } catch (error) {
      this.logger.error('Failed to create basic tenant:', error);
      throw error;
    }
  }

  /**
   * Example 2: Create a tenant with custom role templates
   */
  async createTenantWithCustomRoles(): Promise<void> {
    this.logger.log('Creating tenant with custom role templates');

    try {
      const options: TenantCreationOptions = {
        name: 'Tech Startup Inc',
        subdomain: 'tech-startup',
        isActive: true,
        customRoleTemplates: [
          {
            name: 'Product Manager',
            description: 'Manages product development and roadmap',
            permissions: [
              {
                entityType: 'Customer',
                actions: ['Read', 'Export', 'Download_Report'],
              },
              {
                entityType: 'Lead',
                actions: ['Read', 'Update', 'Export', 'Download_Report'],
              },
              {
                entityType: 'Order',
                actions: ['Read', 'Export', 'Download_Report'],
              },
            ],
          },
          {
            name: 'Customer Success Manager',
            description: 'Manages customer relationships and success',
            permissions: [
              {
                entityType: 'Customer',
                actions: ['Create', 'Read', 'Update', 'Export', 'Download_Report'],
              },
              {
                entityType: 'Lead',
                actions: ['Read', 'Update'],
              },
              {
                entityType: 'Order',
                actions: ['Read', 'Update'],
              },
            ],
          },
        ],
      };

      const result = await this.tenantService.createTenant(options);

      this.logger.log(`Tenant with custom roles created successfully:`);
      this.logger.log(`- Tenant ID: ${result.tenant.id}`);
      this.logger.log(`- System Roles: ${result.systemRoles.totalRoles}`);
      this.logger.log(`- Custom Roles: ${result.customRoles.totalRoles}`);
      this.logger.log(`- Total Permissions: ${result.systemRoles.totalPermissions + result.customRoles.totalPermissions}`);

      // Log details about created roles
      if (result.customRoles.roles.length > 0) {
        this.logger.log('Custom roles created:');
        result.customRoles.roles.forEach(roleResult => {
          if (roleResult.role) {
            this.logger.log(`- ${roleResult.role.name}: ${roleResult.permissionsAssigned} permissions`);
          }
        });
      }
    } catch (error) {
      this.logger.error('Failed to create tenant with custom roles:', error);
      throw error;
    }
  }

  /**
   * Example 3: Create a tenant without system roles (manual setup)
   */
  async createTenantWithoutSystemRoles(): Promise<void> {
    this.logger.log('Creating tenant without automatic system roles');

    try {
      const options: TenantCreationOptions = {
        name: 'Manual Setup Corp',
        subdomain: 'manual-setup',
        isActive: true,
        skipSystemRoles: true, // Skip automatic system role creation
      };

      const result = await this.tenantService.createTenant(options);

      this.logger.log(`Tenant created without system roles:`);
      this.logger.log(`- Tenant ID: ${result.tenant.id}`);
      this.logger.log(`- System Roles: ${result.systemRoles.totalRoles} (skipped)`);
      this.logger.log(`- Custom Roles: ${result.customRoles.totalRoles}`);

      // Later, initialize roles manually
      this.logger.log('Initializing roles manually...');
      const initResult = await this.tenantService.initializeRolesForTenant(result.tenant.id);

      this.logger.log(`Roles initialized:`);
      this.logger.log(`- System Roles: ${initResult.systemRoles.totalRoles}`);
      this.logger.log(`- Custom Roles: ${initResult.customRoles.totalRoles}`);
    } catch (error) {
      this.logger.error('Failed to create tenant without system roles:', error);
      throw error;
    }
  }

  /**
   * Example 4: Initialize roles for an existing tenant
   */
  async initializeRolesForExistingTenant(tenantId: string): Promise<void> {
    this.logger.log(`Initializing roles for existing tenant: ${tenantId}`);

    try {
      const result = await this.tenantService.initializeRolesForTenant(tenantId);

      this.logger.log(`Roles initialized for tenant ${tenantId}:`);
      this.logger.log(`- System Roles: ${result.systemRoles.totalRoles}`);
      this.logger.log(`- System Permissions: ${result.systemRoles.totalPermissions}`);
      this.logger.log(`- Custom Roles: ${result.customRoles.totalRoles}`);
      this.logger.log(`- Custom Permissions: ${result.customRoles.totalPermissions}`);

      if (result.systemRoles.errors.length > 0) {
        this.logger.warn('System role initialization errors:');
        result.systemRoles.errors.forEach(error => this.logger.warn(`- ${error}`));
      }

      if (result.customRoles.errors.length > 0) {
        this.logger.warn('Custom role initialization errors:');
        result.customRoles.errors.forEach(error => this.logger.warn(`- ${error}`));
      }
    } catch (error) {
      this.logger.error(`Failed to initialize roles for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Example 5: Complete tenant setup workflow
   */
  async completeTenantSetupWorkflow(
    tenantName: string,
    subdomain: string,
    adminUserId?: string,
  ): Promise<string> {
    this.logger.log(`Starting complete tenant setup workflow for: ${tenantName}`);

    try {
      // Step 1: Create tenant with all roles
      const options: TenantCreationOptions = {
        name: tenantName,
        subdomain: subdomain,
        isActive: true,
        customRoleTemplates: [
          {
            name: 'Department Manager',
            description: 'Manages department operations and staff',
            permissions: [
              {
                entityType: 'User',
                actions: ['Read', 'Update'],
              },
              {
                entityType: 'Customer',
                actions: ['Create', 'Read', 'Update', 'Export'],
              },
              {
                entityType: 'Lead',
                actions: ['Create', 'Read', 'Update', 'Delete', 'Export'],
              },
            ],
          },
        ],
      };

      const result = await this.tenantService.createTenant(options);
      const tenantId = result.tenant.id;

      this.logger.log(`Tenant setup completed:`);
      this.logger.log(`- Tenant ID: ${tenantId}`);
      this.logger.log(`- Total Roles: ${result.systemRoles.totalRoles + result.customRoles.totalRoles}`);
      this.logger.log(`- Total Permissions: ${result.systemRoles.totalPermissions + result.customRoles.totalPermissions}`);

      // Step 2: If admin user is provided, assign Admin role (this would be done by RoleService)
      if (adminUserId) {
        this.logger.log(`Admin user ${adminUserId} should be assigned to Admin role in tenant ${tenantId}`);
        // Note: This would typically be done using RoleService.assignRoleToUser()
        // but that's outside the scope of this tenant initialization example
      }

      // Step 3: Log summary
      this.logger.log('Tenant setup workflow completed successfully');
      this.logger.log('Available roles:');
      this.logger.log('- System roles: Admin, Operator, Viewer');
      this.logger.log('- Custom roles: Department Manager');
      if (result.customRoles.totalRoles > 1) {
        this.logger.log('- Additional custom roles from configuration');
      }

      return tenantId;
    } catch (error) {
      this.logger.error(`Failed to complete tenant setup workflow for ${tenantName}:`, error);
      throw error;
    }
  }

  /**
   * Example 6: Demonstrate error handling and recovery
   */
  async demonstrateErrorHandling(): Promise<void> {
    this.logger.log('Demonstrating error handling in tenant creation');

    // Example 1: Duplicate tenant name
    try {
      await this.tenantService.createTenant({
        name: 'Duplicate Name',
        subdomain: 'duplicate-1',
      });

      // Try to create another tenant with the same name
      await this.tenantService.createTenant({
        name: 'Duplicate Name', // Same name
        subdomain: 'duplicate-2', // Different subdomain
      });
    } catch (error) {
      this.logger.warn('Expected error for duplicate tenant name:', error.message);
    }

    // Example 2: Invalid subdomain format
    try {
      await this.tenantService.createTenant({
        name: 'Invalid Subdomain Test',
        subdomain: 'Invalid_Subdomain!', // Invalid characters
      });
    } catch (error) {
      this.logger.warn('Expected error for invalid subdomain:', error.message);
    }

    // Example 3: Initialize roles for non-existent tenant
    try {
      await this.tenantService.initializeRolesForTenant('non-existent-tenant-id');
    } catch (error) {
      this.logger.warn('Expected error for non-existent tenant:', error.message);
    }

    this.logger.log('Error handling demonstration completed');
  }
}

/**
 * Example usage in a controller:
 * 
 * @Controller('tenant-setup')
 * export class TenantSetupController {
 *   constructor(private tenantInitExample: TenantInitializationExample) {}
 * 
 *   @Post('basic')
 *   async createBasicTenant() {
 *     await this.tenantInitExample.createBasicTenant();
 *     return { message: 'Basic tenant created successfully' };
 *   }
 * 
 *   @Post('with-custom-roles')
 *   async createTenantWithCustomRoles() {
 *     await this.tenantInitExample.createTenantWithCustomRoles();
 *     return { message: 'Tenant with custom roles created successfully' };
 *   }
 * 
 *   @Post(':tenantId/initialize-roles')
 *   async initializeRoles(@Param('tenantId') tenantId: string) {
 *     await this.tenantInitExample.initializeRolesForExistingTenant(tenantId);
 *     return { message: 'Roles initialized successfully' };
 *   }
 * 
 *   @Post('complete-setup')
 *   async completeSetup(@Body() { name, subdomain, adminUserId }: { name: string; subdomain: string; adminUserId?: string }) {
 *     const tenantId = await this.tenantInitExample.completeTenantSetupWorkflow(name, subdomain, adminUserId);
 *     return { message: 'Complete tenant setup completed', tenantId };
 *   }
 * }
 */