import { registerAs } from '@nestjs/config';

export interface CustomRoleTemplate {
  name: string;
  description: string;
  permissions: Array<{
    entityType: string;
    actions: string[];
  }>;
}

export interface RBACConfig {
  customRoleTemplates: CustomRoleTemplate[];
  tenantInitialization: {
    autoCreateSystemRoles: boolean;
    autoCreateCustomRoles: boolean;
  };
  permissions: {
    cacheTimeout: number; // in seconds
    defaultActions: string[];
  };
}

export default registerAs('rbac', (): RBACConfig => ({
  customRoleTemplates: [
    // Example custom role templates that can be configured
    // These will be automatically created for new tenants
    {
      name: 'Sales Manager',
      description: 'Manages sales operations and customer relationships',
      permissions: [
        {
          entityType: 'Customer',
          actions: ['Create', 'Read', 'Update', 'Export', 'Download_Report'],
        },
        {
          entityType: 'Lead',
          actions: ['Create', 'Read', 'Update', 'Delete', 'Export', 'Download_Report'],
        },
        {
          entityType: 'Order',
          actions: ['Read', 'Update', 'Export', 'Download_Report'],
        },
      ],
    },
    {
      name: 'Support Agent',
      description: 'Provides customer support and handles inquiries',
      permissions: [
        {
          entityType: 'Customer',
          actions: ['Read', 'Update'],
        },
        {
          entityType: 'Lead',
          actions: ['Read', 'Update'],
        },
        {
          entityType: 'Order',
          actions: ['Read'],
        },
      ],
    },
  ],
  tenantInitialization: {
    autoCreateSystemRoles: process.env.RBAC_AUTO_CREATE_SYSTEM_ROLES !== 'false',
    autoCreateCustomRoles: process.env.RBAC_AUTO_CREATE_CUSTOM_ROLES !== 'false',
  },
  permissions: {
    cacheTimeout: parseInt(process.env.RBAC_CACHE_TIMEOUT || '300', 10), // 5 minutes default
    defaultActions: [
      'Create',
      'Read',
      'Update',
      'Delete',
      'Export',
      'Import',
      'Download_Report',
      'Bulk_Update',
      'Bulk_Delete',
    ],
  },
}));

/**
 * Example environment variables for configuration:
 * 
 * # Tenant initialization settings
 * RBAC_AUTO_CREATE_SYSTEM_ROLES=true
 * RBAC_AUTO_CREATE_CUSTOM_ROLES=true
 * 
 * # Permission settings
 * RBAC_CACHE_TIMEOUT=300
 * 
 * # Custom role templates can also be configured via JSON in environment
 * RBAC_CUSTOM_ROLE_TEMPLATES='[{"name":"Custom Role","description":"Custom description","permissions":[{"entityType":"Entity","actions":["Read"]}]}]'
 */

/**
 * Helper function to parse custom role templates from environment variable
 * This allows runtime configuration of custom role templates
 */
export function parseCustomRoleTemplatesFromEnv(): CustomRoleTemplate[] {
  try {
    const envTemplates = process.env.RBAC_CUSTOM_ROLE_TEMPLATES;
    if (!envTemplates) {
      return [];
    }

    const parsed = JSON.parse(envTemplates);
    if (!Array.isArray(parsed)) {
      console.warn('RBAC_CUSTOM_ROLE_TEMPLATES must be a JSON array');
      return [];
    }

    // Validate each template
    const validTemplates = parsed.filter((template) => {
      if (!template.name || !template.description || !Array.isArray(template.permissions)) {
        console.warn(`Invalid custom role template structure: ${JSON.stringify(template)}`);
        return false;
      }

      // Validate permissions structure
      const validPermissions = template.permissions.every((perm: any) => {
        return perm.entityType && Array.isArray(perm.actions);
      });

      if (!validPermissions) {
        console.warn(`Invalid permissions structure in template: ${template.name}`);
        return false;
      }

      return true;
    });

    console.log(`Loaded ${validTemplates.length} custom role templates from environment`);
    return validTemplates;
  } catch (error) {
    console.warn('Failed to parse RBAC_CUSTOM_ROLE_TEMPLATES from environment:', error.message);
    return [];
  }
}