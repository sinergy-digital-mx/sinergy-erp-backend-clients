"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RoleTemplateExample_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleTemplateExample = void 0;
const common_1 = require("@nestjs/common");
const role_template_service_1 = require("../services/role-template.service");
const role_service_1 = require("../services/role.service");
const role_templates_1 = require("../templates/role-templates");
let RoleTemplateExample = RoleTemplateExample_1 = class RoleTemplateExample {
    roleTemplateService;
    roleService;
    logger = new common_1.Logger(RoleTemplateExample_1.name);
    constructor(roleTemplateService, roleService) {
        this.roleTemplateService = roleTemplateService;
        this.roleService = roleService;
    }
    async createSystemRolesForNewTenant(tenantId) {
        this.logger.log(`Creating system roles for tenant: ${tenantId}`);
        try {
            const result = await this.roleTemplateService.createSystemRolesForTenant(tenantId);
            this.logger.log(`Successfully created ${result.totalRoles} system roles`);
            this.logger.log(`Total permissions assigned: ${result.totalPermissions}`);
            if (result.errors.length > 0) {
                this.logger.warn(`Encountered ${result.errors.length} errors:`, result.errors);
            }
            for (const roleResult of result.roles) {
                if (roleResult.role) {
                    this.logger.log(`Role "${roleResult.role.name}": ` +
                        `${roleResult.permissionsCreated} permissions created, ` +
                        `${roleResult.permissionsAssigned} permissions assigned`);
                }
            }
        }
        catch (error) {
            this.logger.error(`Failed to create system roles for tenant ${tenantId}:`, error);
            throw error;
        }
    }
    async createAdminRoleForTenant(tenantId) {
        this.logger.log(`Creating Admin role for tenant: ${tenantId}`);
        try {
            const result = await this.roleTemplateService.createRoleFromSystemTemplate('Admin', tenantId);
            if (result.role) {
                this.logger.log(`Admin role created with ID: ${result.role.id}`);
                this.logger.log(`Permissions assigned: ${result.permissionsAssigned}`);
                if (result.warnings.length > 0) {
                    this.logger.warn('Warnings during role creation:', result.warnings);
                }
            }
        }
        catch (error) {
            this.logger.error(`Failed to create Admin role for tenant ${tenantId}:`, error);
            throw error;
        }
    }
    async createCustomSalesRole(tenantId) {
        this.logger.log(`Creating custom Sales role for tenant: ${tenantId}`);
        try {
            const result = await this.roleTemplateService.createRoleFromCustomTemplate('Sales Representative', 'Sales team member with access to customers and leads', [
                {
                    entityType: 'Customer',
                    actions: ['Read', 'Update', 'Export'],
                },
                {
                    entityType: 'Lead',
                    actions: ['Create', 'Read', 'Update', 'Delete', 'Export'],
                },
            ], tenantId, false);
            if (result.role) {
                this.logger.log(`Sales Representative role created with ID: ${result.role.id}`);
                this.logger.log(`Permissions created: ${result.permissionsCreated}`);
                this.logger.log(`Permissions assigned: ${result.permissionsAssigned}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to create Sales role for tenant ${tenantId}:`, error);
            throw error;
        }
    }
    async updateRoleToMatchOperatorTemplate(roleId) {
        this.logger.log(`Updating role ${roleId} to match Operator template`);
        try {
            const operatorTemplate = this.roleTemplateService.getSystemRoleTemplate('Operator');
            if (!operatorTemplate) {
                throw new Error('Operator template not found');
            }
            const result = await this.roleTemplateService.updateRoleToMatchTemplate(roleId, operatorTemplate);
            this.logger.log(`Role updated successfully`);
            this.logger.log(`New permissions created: ${result.permissionsCreated}`);
            this.logger.log(`New permissions assigned: ${result.permissionsAssigned}`);
            if (result.warnings.length > 0) {
                this.logger.warn('Warnings during role update:', result.warnings);
            }
        }
        catch (error) {
            this.logger.error(`Failed to update role ${roleId}:`, error);
            throw error;
        }
    }
    async validateRoleAgainstTemplate(roleId, templateName) {
        this.logger.log(`Validating role ${roleId} against ${templateName} template`);
        try {
            const template = this.roleTemplateService.getSystemRoleTemplate(templateName);
            if (!template) {
                throw new Error(`Template ${templateName} not found`);
            }
            const validation = await this.roleTemplateService.validateRoleAgainstTemplate(roleId, template);
            if (validation.matches) {
                this.logger.log(`✅ Role matches ${templateName} template perfectly`);
            }
            else {
                this.logger.warn(`❌ Role does not match ${templateName} template`);
                if (validation.missingPermissions.length > 0) {
                    this.logger.warn(`Missing permissions: ${validation.missingPermissions.join(', ')}`);
                }
                if (validation.extraPermissions.length > 0) {
                    this.logger.warn(`Extra permissions: ${validation.extraPermissions.join(', ')}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`Failed to validate role ${roleId}:`, error);
            throw error;
        }
    }
    listAvailableSystemTemplates() {
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
    async createAndUseCustomTemplate(tenantId) {
        this.logger.log(`Creating and using custom template for tenant: ${tenantId}`);
        try {
            const supportTemplate = (0, role_templates_1.createCustomRoleTemplate)('Support Agent', 'Customer support agent with limited access', [
                {
                    entityType: 'Customer',
                    actions: ['Read', 'Update'],
                },
                {
                    entityType: 'Lead',
                    actions: ['Read'],
                },
            ], false);
            const result = await this.roleTemplateService.createRoleFromTemplate(supportTemplate, tenantId);
            if (result.role) {
                this.logger.log(`Support Agent role created with ID: ${result.role.id}`);
                this.logger.log(`Permissions assigned: ${result.permissionsAssigned}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to create custom template role for tenant ${tenantId}:`, error);
            throw error;
        }
    }
    async assignUsersToTemplateRoles(tenantId, userIds) {
        this.logger.log(`Assigning users to template-created roles in tenant: ${tenantId}`);
        try {
            const roles = await this.roleService.getTenantRoles(tenantId);
            const adminRole = roles.find(role => role.name === 'Admin');
            const operatorRole = roles.find(role => role.name === 'Operator');
            const viewerRole = roles.find(role => role.name === 'Viewer');
            if (!adminRole || !operatorRole || !viewerRole) {
                throw new Error('System roles not found. Please create them first.');
            }
            if (userIds.length > 0) {
                await this.roleService.assignRoleToUser(userIds[0], adminRole.id, tenantId);
                this.logger.log(`Assigned user ${userIds[0]} to Admin role`);
            }
            if (userIds.length > 1) {
                await this.roleService.assignRoleToUser(userIds[1], operatorRole.id, tenantId);
                this.logger.log(`Assigned user ${userIds[1]} to Operator role`);
            }
            for (let i = 2; i < userIds.length; i++) {
                await this.roleService.assignRoleToUser(userIds[i], viewerRole.id, tenantId);
                this.logger.log(`Assigned user ${userIds[i]} to Viewer role`);
            }
            this.logger.log(`Successfully assigned ${userIds.length} users to roles`);
        }
        catch (error) {
            this.logger.error(`Failed to assign users to roles in tenant ${tenantId}:`, error);
            throw error;
        }
    }
    async completeTenantSetup(tenantId, adminUserId) {
        this.logger.log(`Performing complete tenant setup for: ${tenantId}`);
        try {
            await this.createSystemRolesForNewTenant(tenantId);
            await this.createCustomSalesRole(tenantId);
            const roles = await this.roleService.getTenantRoles(tenantId);
            const adminRole = roles.find(role => role.name === 'Admin');
            if (adminRole) {
                await this.roleService.assignRoleToUser(adminUserId, adminRole.id, tenantId);
                this.logger.log(`Assigned admin user ${adminUserId} to Admin role`);
            }
            this.logger.log(`✅ Complete tenant setup finished for ${tenantId}`);
        }
        catch (error) {
            this.logger.error(`Failed to complete tenant setup for ${tenantId}:`, error);
            throw error;
        }
    }
};
exports.RoleTemplateExample = RoleTemplateExample;
exports.RoleTemplateExample = RoleTemplateExample = RoleTemplateExample_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [role_template_service_1.RoleTemplateService,
        role_service_1.RoleService])
], RoleTemplateExample);
//# sourceMappingURL=role-template.example.js.map