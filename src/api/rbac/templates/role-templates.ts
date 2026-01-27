/**
 * Role template definitions for the RBAC system
 * These templates define predefined roles that can be automatically created for new tenants
 */

export interface RoleTemplate {
  name: string;
  description: string;
  permissions: Array<{
    entityType: string;
    actions: string[];
  }>;
  isSystemRole?: boolean;
}

/**
 * System role templates that are automatically created for new tenants
 * These templates follow the requirements 4.1, 4.2, and 4.3
 */
export const SYSTEM_ROLE_TEMPLATES: RoleTemplate[] = [
  {
    name: 'Admin',
    description: 'Full access to all entities and actions',
    isSystemRole: true,
    permissions: [
      {
        entityType: '*', // Wildcard for all entities
        actions: ['*'], // Wildcard for all actions
      },
    ],
  },
  {
    name: 'Operator',
    description: 'Read access to customers and leads, no user management',
    isSystemRole: true,
    permissions: [
      {
        entityType: 'Customer',
        actions: ['Read', 'Update', 'Export', 'Download_Report'],
      },
      {
        entityType: 'Lead',
        actions: ['Read', 'Update', 'Create', 'Export', 'Download_Report'],
      },
    ],
  },
  {
    name: 'Viewer',
    description: 'Read-only access to basic entities',
    isSystemRole: true,
    permissions: [
      {
        entityType: 'Customer',
        actions: ['Read'],
      },
      {
        entityType: 'Lead',
        actions: ['Read'],
      },
    ],
  },
];

/**
 * Get all available system role templates
 * @returns RoleTemplate[] - Array of system role templates
 */
export function getSystemRoleTemplates(): RoleTemplate[] {
  return [...SYSTEM_ROLE_TEMPLATES];
}

/**
 * Get a specific role template by name
 * @param name - The name of the role template
 * @returns RoleTemplate | undefined - The role template if found
 */
export function getRoleTemplateByName(name: string): RoleTemplate | undefined {
  return SYSTEM_ROLE_TEMPLATES.find(template => template.name === name);
}

/**
 * Validate that a role template has valid structure
 * @param template - The role template to validate
 * @returns boolean - True if valid, false otherwise
 */
export function validateRoleTemplate(template: RoleTemplate): boolean {
  if (!template.name || !template.description || !template.permissions) {
    return false;
  }

  if (!Array.isArray(template.permissions) || template.permissions.length === 0) {
    return false;
  }

  for (const permission of template.permissions) {
    if (!permission.entityType || !permission.actions || !Array.isArray(permission.actions)) {
      return false;
    }

    if (permission.actions.length === 0) {
      return false;
    }
  }

  return true;
}

/**
 * Get all supported actions for role templates
 * @returns string[] - Array of supported actions
 */
export function getSupportedActions(): string[] {
  return [
    'Create',
    'Read',
    'Update',
    'Delete',
    'Export',
    'Import',
    'Download_Report',
    'Bulk_Update',
    'Bulk_Delete',
  ];
}

/**
 * Validate that an action is supported
 * @param action - The action to validate
 * @returns boolean - True if valid or wildcard, false otherwise
 */
export function validateAction(action: string): boolean {
  return action === '*' || getSupportedActions().includes(action);
}

/**
 * Expand wildcard permissions to concrete permissions
 * @param template - The role template with potential wildcards
 * @param availableEntityTypes - Array of available entity types from Entity Registry
 * @returns RoleTemplate - Template with expanded permissions (no wildcards)
 */
export function expandWildcardPermissions(
  template: RoleTemplate,
  availableEntityTypes: string[],
): RoleTemplate {
  const expandedTemplate: RoleTemplate = {
    ...template,
    permissions: [],
  };

  for (const permission of template.permissions) {
    if (permission.entityType === '*') {
      // Expand entity wildcard to all available entities
      for (const entityType of availableEntityTypes) {
        expandedTemplate.permissions.push({
          entityType,
          actions: permission.actions.includes('*') 
            ? getSupportedActions() 
            : permission.actions,
        });
      }
    } else {
      // Keep specific entity type, but expand action wildcards if needed
      expandedTemplate.permissions.push({
        entityType: permission.entityType,
        actions: permission.actions.includes('*') 
          ? getSupportedActions() 
          : permission.actions,
      });
    }
  }

  return expandedTemplate;
}

/**
 * Create a custom role template
 * @param name - The name of the role
 * @param description - The description of the role
 * @param permissions - Array of permissions for the role
 * @param isSystemRole - Whether this is a system role (default: false)
 * @returns RoleTemplate - The created role template
 */
export function createCustomRoleTemplate(
  name: string,
  description: string,
  permissions: Array<{ entityType: string; actions: string[] }>,
  isSystemRole: boolean = false,
): RoleTemplate {
  const template: RoleTemplate = {
    name,
    description,
    permissions,
    isSystemRole,
  };

  if (!validateRoleTemplate(template)) {
    throw new Error('Invalid role template structure');
  }

  return template;
}