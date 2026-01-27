/**
 * Example usage of the Role Template Service
 * This file demonstrates how to use role templates to create predefined roles
 */

import { Injectable, Logger } from '@nestjs/common';
import { RoleTemplateService } from '../services/role-template.service';
import { RoleService } from '../services/role.service';
import { 
  RoleTemplate, 
  createCustomRoleTemplate,
  SYSTEM_ROLE_TEMPLATES 
} from '../templates/role-templates';

@Injectable()
export class RoleTemplateExample {
  private readonly logger = new Logger(RoleTemplateExample.name);

  constructor(
    private roleTemplateService: RoleTemplateService,
    private roleService: RoleService,
  ) {}

  /**
   * Example 1: Create all system roles for a new tenant
   */
  async createSystemRolesForNewTenant(tenantId: string): Promise<void> {
    this.logger.log(`Creating system roles for tenant: ${tenantId}`);

    try {
      const result = await this.roleTemplateService.createSystemRolesForTenant(tenantId);
      
      this.logger.log(`Successfully created ${result.totalRoles} system roles`);
      this.logger.log(`Total permissions assigned: ${result.totalPermissions}`);
      
      if (result.errors.length > 0) {
        this.logger.warn(`Encountered ${result.errors.length} errors:`, result.errors);
      }

      // Log details for each created role
      for (const roleResult of result.roles) {
        if (roleResult.role) {
          this.logger.log(
            `Role "${roleResult.role.name}": ` +
            `${roleResult.permissionsCreated} permissions created, ` +
            `${roleResult.permissionsAssigned} permissions assigned`
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to create system roles for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Example 2: Create a specific system role
   */
  async createAdminRoleForTenant(tenantId: string): Promise<void> {
    this.logger.log(`Creating Admin role for tenant: ${tenantId}`);

    try {
      const result = await this.roleTemplateService.createRoleFromSystemTemplate(
        'Admin',
        tenantId
      );

      if (result.role) {
        this.logger.log(`Admin role created with ID: ${result.role.id}`);
        this.logger.log(`Permissions assigned: ${result.permissionsAssigned}`);
        
        if (result.warnings.length > 0) {
          this.logger.warn('Warnings during role creation:', result.warnings);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to create Admin role for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Example 3: Create a custom role using templates
   */
  async createCustomSalesRole(tenantId: string): Promise<void> {
    this.logger.log(`Creating custom Sales role for tenant: ${tenantId}`);

    try {
      const result = await this.roleTemplateService.createRoleFromCustomTemplate(
        'Sales Representative',
        'Sales team member with access to customers and leads',
        [
          {
            entityType: 'Customer',
            actions: ['Read', 'Update', 'Export'],
          },
          {
            entityType: 'Lead',
            actions: ['Create', 'Read', 'Update', 'Delete', 'Export'],
          },
        ],
        tenantId,
        false // Not a system role
      );

      if (result.role) {
        this.logger.log(`Sales Representative role created with ID: ${result.role.id}`);
        this.logger.log(`Permissions created: ${result.permissionsCreated}`);
        this.logger.log(`Permissions assigned: ${result.permissionsAssigned}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create Sales role for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Example 4: Update an existing role to match a template
   */
  async updateRoleToMatchOperatorTemplate(roleId: string): Promise<void> {
    this.logger.log(`Updating role ${roleId} to match Operator template`);

    try {
      const operatorTemplate = this.roleTemplateService.getSystemRoleTemplate('Operator');
      
      if (!operatorTemplate) {
        throw new Error('Operator template not found');
      }

      const result = await this.roleTemplateService.updateRoleToMatchTemplate(
        roleId,
        operatorTemplate
      );

      this.logger.log(`Role updated successfully`);
      this.logger.log(`New permissions created: ${result.permissionsCreated}`);
      this.logger.log(`New permissions assigned: ${result.permissionsAssigned}`);
      
      if (result.warnings.length > 0) {
        this.logger.warn('Warnings during role update:', result.warnings);
      }
    } catch (error) {
      this.logger.error(`Failed to update role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Example 5: Validate a role against a template
   */
  async validateRoleAgainstTemplate(roleId: string, templateName: string): Promise<void> {
    this.logger.log(`Validating role ${roleId} against ${templateName} template`);

    try {
      const template = this.roleTemplateService.getSystemRoleTemplate(templateName);
      
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      const validation = await this.roleTemplateService.validateRoleAgainstTemplate(
        roleId,
        template
      );

      if (validation.matches) {
        this.logger.log(`✅ Role matches ${templateName} template perfectly`);
      } else {
        this.logger.warn(`❌ Role does not match ${templateName} template`);
        
        if (validation.missingPermissions.length > 0) {
          this.logger.warn(`Missing permissions: ${validation.missingPermissions.join(', ')}`);
        }
        
        if (validation.extraPermissions.length > 0) {
          this.logger.warn(`Extra permissions: ${validation.extraPermissions.join(', ')}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to validate role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Example 6: List all available system role templates
   */
  listAvailableSystemTemplates(): void {
    this.logger.log('Available system role templates:');

    const templates = this.roleTemplateService.getSystemRoleTemplates();
    
    for (const template of templates) {
      this.logger.log(`📋 ${template.name}: ${template.description}`);
      this.logger.log(`   Permissions: ${template.permissions.length} permission groups`);
      
      for (const permission of template.permissions) {
        this.logger.log(`   - ${permission.entityType}: ${permission.actions.join(', ')}`);
      }
    }
  }

  /**
   * Example 7: Create a custom template and use it
   */
  async createAndUseCustomTemplate(tenantId: string): Promise<void> {
    this.logger.log(`Creating and using custom template for tenant: ${tenantId}`);

    try {
      // Create a custom template for a support role
      const supportTemplate = createCustomRoleTemplate(
        'Support Agent',
        'Customer support agent with limited access',
        [
          {
            entityType: 'Customer',
            actions: ['Read', 'Update'],
          },
          {
            entityType: 'Lead',
            actions: ['Read'],
          },
        ],
        false // Not a system role
      );

      // Use the custom template to create a role
      const result = await this.roleTemplateService.createRoleFromTemplate(
        supportTemplate,
        tenantId
      );

      if (result.role) {
        this.logger.log(`Support Agent role created with ID: ${result.role.id}`);
        this.logger.log(`Permissions assigned: ${result.permissionsAssigned}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create custom template role for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Example 8: Assign users to roles created from templates
   */
  async assignUsersToTemplateRoles(tenantId: string, userIds: string[]): Promise<void> {
    this.logger.log(`Assigning users to template-created roles in tenant: ${tenantId}`);

    try {
      // Get all roles in the tenant
      const roles = await this.roleService.getTenantRoles(tenantId);
      
      // Find the Admin role (created from template)
      const adminRole = roles.find(role => role.name === 'Admin');
      const operatorRole = roles.find(role => role.name === 'Operator');
      const viewerRole = roles.find(role => role.name === 'Viewer');

      if (!adminRole || !operatorRole || !viewerRole) {
        throw new Error('System roles not found. Please create them first.');
      }

      // Assign first user as Admin
      if (userIds.length > 0) {
        await this.roleService.assignRoleToUser(userIds[0], adminRole.id, tenantId);
        this.logger.log(`Assigned user ${userIds[0]} to Admin role`);
      }

      // Assign second user as Operator
      if (userIds.length > 1) {
        await this.roleService.assignRoleToUser(userIds[1], operatorRole.id, tenantId);
        this.logger.log(`Assigned user ${userIds[1]} to Operator role`);
      }

      // Assign remaining users as Viewers
      for (let i = 2; i < userIds.length; i++) {
        await this.roleService.assignRoleToUser(userIds[i], viewerRole.id, tenantId);
        this.logger.log(`Assigned user ${userIds[i]} to Viewer role`);
      }

      this.logger.log(`Successfully assigned ${userIds.length} users to roles`);
    } catch (error) {
      this.logger.error(`Failed to assign users to roles in tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Example 9: Complete tenant setup with role templates
   */
  async completeTenantSetup(tenantId: string, adminUserId: string): Promise<void> {
    this.logger.log(`Performing complete tenant setup for: ${tenantId}`);

    try {
      // Step 1: Create all system roles
      await this.createSystemRolesForNewTenant(tenantId);

      // Step 2: Create custom roles for specific business needs
      await this.createCustomSalesRole(tenantId);

      // Step 3: Assign the admin user to the Admin role
      const roles = await this.roleService.getTenantRoles(tenantId);
      const adminRole = roles.find(role => role.name === 'Admin');
      
      if (adminRole) {
        await this.roleService.assignRoleToUser(adminUserId, adminRole.id, tenantId);
        this.logger.log(`Assigned admin user ${adminUserId} to Admin role`);
      }

      this.logger.log(`✅ Complete tenant setup finished for ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to complete tenant setup for ${tenantId}:`, error);
      throw error;
    }
  }
}

/**
 * Usage examples in a controller or service:
 * 
 * @Controller('tenant-setup')
 * export class TenantSetupController {
 *   constructor(private roleTemplateExample: RoleTemplateExample) {}
 * 
 *   @Post(':tenantId/setup')
 *   async setupTenant(@Param('tenantId') tenantId: string, @Body() { adminUserId }: { adminUserId: string }) {
 *     await this.roleTemplateExample.completeTenantSetup(tenantId, adminUserId);
 *     return { message: 'Tenant setup completed successfully' };
 *   }
 * 
 *   @Post(':tenantId/roles/system')
 *   async createSystemRoles(@Param('tenantId') tenantId: string) {
 *     await this.roleTemplateExample.createSystemRolesForNewTenant(tenantId);
 *     return { message: 'System roles created successfully' };
 *   }
 * 
 *   @Get('templates')
 *   getAvailableTemplates() {
 *     return this.roleTemplateExample.listAvailableSystemTemplates();
 *   }
 * }
 */