"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCustomRoleTemplatesFromEnv = parseCustomRoleTemplatesFromEnv;
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('rbac', () => ({
    customRoleTemplates: [
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
        cacheTimeout: parseInt(process.env.RBAC_CACHE_TIMEOUT || '300', 10),
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
function parseCustomRoleTemplatesFromEnv() {
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
        const validTemplates = parsed.filter((template) => {
            if (!template.name || !template.description || !Array.isArray(template.permissions)) {
                console.warn(`Invalid custom role template structure: ${JSON.stringify(template)}`);
                return false;
            }
            const validPermissions = template.permissions.every((perm) => {
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
    }
    catch (error) {
        console.warn('Failed to parse RBAC_CUSTOM_ROLE_TEMPLATES from environment:', error.message);
        return [];
    }
}
//# sourceMappingURL=rbac.config.js.map