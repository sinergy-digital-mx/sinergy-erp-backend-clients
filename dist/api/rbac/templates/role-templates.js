"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_ROLE_TEMPLATES = void 0;
exports.getSystemRoleTemplates = getSystemRoleTemplates;
exports.getRoleTemplateByName = getRoleTemplateByName;
exports.validateRoleTemplate = validateRoleTemplate;
exports.getSupportedActions = getSupportedActions;
exports.validateAction = validateAction;
exports.expandWildcardPermissions = expandWildcardPermissions;
exports.createCustomRoleTemplate = createCustomRoleTemplate;
exports.SYSTEM_ROLE_TEMPLATES = [
    {
        name: 'Admin',
        description: 'Full access to all entities and actions',
        isSystemRole: true,
        permissions: [
            {
                entityType: '*',
                actions: ['*'],
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
function getSystemRoleTemplates() {
    return [...exports.SYSTEM_ROLE_TEMPLATES];
}
function getRoleTemplateByName(name) {
    return exports.SYSTEM_ROLE_TEMPLATES.find(template => template.name === name);
}
function validateRoleTemplate(template) {
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
function getSupportedActions() {
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
function validateAction(action) {
    return action === '*' || getSupportedActions().includes(action);
}
function expandWildcardPermissions(template, availableEntityTypes) {
    const expandedTemplate = {
        ...template,
        permissions: [],
    };
    for (const permission of template.permissions) {
        if (permission.entityType === '*') {
            for (const entityType of availableEntityTypes) {
                expandedTemplate.permissions.push({
                    entityType,
                    actions: permission.actions.includes('*')
                        ? getSupportedActions()
                        : permission.actions,
                });
            }
        }
        else {
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
function createCustomRoleTemplate(name, description, permissions, isSystemRole = false) {
    const template = {
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
//# sourceMappingURL=role-templates.js.map