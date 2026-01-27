/**
 * Enhanced role templates with more specific permissions for business operations
 * These templates provide more granular control than the basic system roles
 */

import { RoleTemplate } from './role-templates';

/**
 * Business-focused role templates for different user types
 */
export const BUSINESS_ROLE_TEMPLATES: RoleTemplate[] = [
  {
    name: 'Sales Manager',
    description: 'Full access to leads and customers, can manage sales team',
    isSystemRole: false,
    permissions: [
      {
        entityType: 'Lead',
        actions: ['Create', 'Read', 'Update', 'Delete', 'Convert', 'Assign', 'Export', 'Download_Report'],
      },
      {
        entityType: 'Lead:Activity',
        actions: ['Create', 'Read', 'Update', 'Delete', 'Export', 'View_All'],
      },
      {
        entityType: 'Customer',
        actions: ['Create', 'Read', 'Update', 'Export', 'Download_Report', 'Bulk_Update'],
      },
      {
        entityType: 'User',
        actions: ['Read', 'Assign'], // Can view team and assign leads
      },
      {
        entityType: 'Report',
        actions: ['Create', 'Read', 'Export', 'Schedule'],
      },
    ],
  },
  {
    name: 'Sales Representative',
    description: 'Can manage assigned leads and customers',
    isSystemRole: false,
    permissions: [
      {
        entityType: 'Lead',
        actions: ['Create', 'Read', 'Update', 'Convert', 'Export'],
      },
      {
        entityType: 'Lead:Activity',
        actions: ['Create', 'Read', 'Update', 'Delete'],
      },
      {
        entityType: 'Customer',
        actions: ['Read', 'Update', 'Export'],
      },
      {
        entityType: 'Report',
        actions: ['Read', 'Export'],
      },
    ],
  },
  {
    name: 'Marketing Specialist',
    description: 'Focus on lead generation and campaign management',
    isSystemRole: false,
    permissions: [
      {
        entityType: 'Lead',
        actions: ['Create', 'Read', 'Update', 'Import', 'Export', 'Download_Report'],
      },
      {
        entityType: 'Activity',
        actions: ['Create', 'Read', 'Update', 'Export'], // Can track marketing activities
      },
      {
        entityType: 'Customer',
        actions: ['Read', 'Export'], // Read-only access to customers
      },
      {
        entityType: 'Report',
        actions: ['Create', 'Read', 'Export', 'Schedule'],
      },
    ],
  },
  {
    name: 'Customer Support',
    description: 'Customer service and support operations',
    isSystemRole: false,
    permissions: [
      {
        entityType: 'Customer',
        actions: ['Read', 'Update', 'Export'],
      },
      {
        entityType: 'Lead',
        actions: ['Read', 'Update'],
      },
      {
        entityType: 'Lead:Activity',
        actions: ['Create', 'Read', 'Update'], // Can update lead status but not create/delete
      },
      {
        entityType: 'Report',
        actions: ['Read', 'Export'],
      },
    ],
  },
  {
    name: 'Data Analyst',
    description: 'Read-only access with advanced reporting capabilities',
    isSystemRole: false,
    permissions: [
      {
        entityType: 'Customer',
        actions: ['Read', 'Export', 'Download_Report'],
      },
      {
        entityType: 'Lead',
        actions: ['Read', 'Export', 'Download_Report'],
      },
      {
        entityType: 'Activity',
        actions: ['Read', 'Export', 'View_All'], // Can analyze all activities
      },
      {
        entityType: 'Report',
        actions: ['Create', 'Read', 'Update', 'Export', 'Schedule'],
      },
      {
        entityType: 'AuditLog',
        actions: ['Read', 'Export'],
      },
    ],
  },
  {
    name: 'HR Manager',
    description: 'User and role management capabilities',
    isSystemRole: false,
    permissions: [
      {
        entityType: 'User',
        actions: ['Create', 'Read', 'Update', 'Activate', 'Deactivate', 'Reset_Password'],
      },
      {
        entityType: 'Role',
        actions: ['Read', 'Assign', 'Revoke'],
      },
      {
        entityType: 'AuditLog',
        actions: ['Read', 'Export'],
      },
    ],
  },
  {
    name: 'System Administrator',
    description: 'Technical administration without business data access',
    isSystemRole: false,
    permissions: [
      {
        entityType: 'User',
        actions: ['Create', 'Read', 'Update', 'Delete', 'Activate', 'Deactivate', 'Reset_Password'],
      },
      {
        entityType: 'Role',
        actions: ['Create', 'Read', 'Update', 'Delete', 'Assign', 'Revoke'],
      },
      {
        entityType: 'Permission',
        actions: ['Read', 'Assign', 'Revoke'],
      },
      {
        entityType: 'Tenant',
        actions: ['Read', 'Update', 'Configure'],
      },
      {
        entityType: 'AuditLog',
        actions: ['Read', 'Export', 'Delete'],
      },
    ],
  },
  {
    name: 'Read Only Auditor',
    description: 'Audit and compliance role with read-only access',
    isSystemRole: false,
    permissions: [
      {
        entityType: 'Customer',
        actions: ['Read'],
      },
      {
        entityType: 'Lead',
        actions: ['Read'],
      },
      {
        entityType: 'User',
        actions: ['Read'],
      },
      {
        entityType: 'Role',
        actions: ['Read'],
      },
      {
        entityType: 'AuditLog',
        actions: ['Read', 'Export'],
      },
      {
        entityType: 'Report',
        actions: ['Read', 'Export'],
      },
    ],
  },
];

/**
 * Get all business role templates
 */
export function getBusinessRoleTemplates(): RoleTemplate[] {
  return [...BUSINESS_ROLE_TEMPLATES];
}

/**
 * Get all role templates (system + business)
 */
export function getAllRoleTemplates(): RoleTemplate[] {
  const { getSystemRoleTemplates } = require('./role-templates');
  return [...getSystemRoleTemplates(), ...BUSINESS_ROLE_TEMPLATES];
}

/**
 * Get role template by name from all templates
 */
export function getAnyRoleTemplateByName(name: string): RoleTemplate | undefined {
  return getAllRoleTemplates().find(template => template.name === name);
}

/**
 * Get role templates by category
 */
export function getRoleTemplatesByCategory(category: 'system' | 'business' | 'all' = 'all'): RoleTemplate[] {
  switch (category) {
    case 'system':
      const { getSystemRoleTemplates } = require('./role-templates');
      return getSystemRoleTemplates();
    case 'business':
      return getBusinessRoleTemplates();
    case 'all':
    default:
      return getAllRoleTemplates();
  }
}

/**
 * Create a role template for a specific department
 */
export function createDepartmentRoleTemplate(
  departmentName: string,
  permissions: Array<{ entityType: string; actions: string[] }>,
  description?: string,
): RoleTemplate {
  return {
    name: `${departmentName} User`,
    description: description || `Standard user role for ${departmentName} department`,
    isSystemRole: false,
    permissions,
  };
}

/**
 * Permission sets for common business scenarios
 */
export const PERMISSION_SETS = {
  FULL_CUSTOMER_ACCESS: {
    entityType: 'Customer',
    actions: ['Create', 'Read', 'Update', 'Delete', 'Export', 'Import', 'Bulk_Update', 'Download_Report'],
  },
  READ_ONLY_CUSTOMER: {
    entityType: 'Customer',
    actions: ['Read'],
  },
  FULL_LEAD_ACCESS: {
    entityType: 'Lead',
    actions: ['Create', 'Read', 'Update', 'Delete', 'Convert', 'Assign', 'Export', 'Import', 'Download_Report'],
  },
  LEAD_MANAGEMENT: {
    entityType: 'Lead',
    actions: ['Create', 'Read', 'Update', 'Convert', 'Export'],
  },
  FULL_ACTIVITY_ACCESS: {
    entityType: 'Activity',
    actions: ['Create', 'Read', 'Update', 'Delete', 'Export', 'View_All'],
  },
  ACTIVITY_MANAGEMENT: {
    entityType: 'Activity',
    actions: ['Create', 'Read', 'Update', 'Delete'],
  },
  READ_ONLY_ACTIVITY: {
    entityType: 'Activity',
    actions: ['Read'],
  },
  USER_MANAGEMENT: {
    entityType: 'User',
    actions: ['Create', 'Read', 'Update', 'Activate', 'Deactivate', 'Reset_Password'],
  },
  REPORTING_ACCESS: {
    entityType: 'Report',
    actions: ['Create', 'Read', 'Update', 'Export', 'Schedule'],
  },
  AUDIT_ACCESS: {
    entityType: 'AuditLog',
    actions: ['Read', 'Export'],
  },
};

/**
 * Quick role builder using permission sets
 */
export function buildRoleFromPermissionSets(
  name: string,
  description: string,
  permissionSetKeys: (keyof typeof PERMISSION_SETS)[],
): RoleTemplate {
  const permissions = permissionSetKeys.map(key => PERMISSION_SETS[key]);
  
  return {
    name,
    description,
    isSystemRole: false,
    permissions,
  };
}