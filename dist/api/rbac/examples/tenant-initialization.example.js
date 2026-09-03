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
var TenantInitializationExample_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantInitializationExample = void 0;
const common_1 = require("@nestjs/common");
const tenant_service_1 = require("../services/tenant.service");
let TenantInitializationExample = TenantInitializationExample_1 = class TenantInitializationExample {
    tenantService;
    logger = new common_1.Logger(TenantInitializationExample_1.name);
    constructor(tenantService) {
        this.tenantService = tenantService;
    }
    async createBasicTenant() {
        this.logger.log('Creating basic tenant with system roles');
        try {
            const options = {
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
        }
        catch (error) {
            this.logger.error('Failed to create basic tenant:', error);
            throw error;
        }
    }
    async createTenantWithCustomRoles() {
        this.logger.log('Creating tenant with custom role templates');
        try {
            const options = {
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
            if (result.customRoles.roles.length > 0) {
                this.logger.log('Custom roles created:');
                result.customRoles.roles.forEach(roleResult => {
                    if (roleResult.role) {
                        this.logger.log(`- ${roleResult.role.name}: ${roleResult.permissionsAssigned} permissions`);
                    }
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to create tenant with custom roles:', error);
            throw error;
        }
    }
    async createTenantWithoutSystemRoles() {
        this.logger.log('Creating tenant without automatic system roles');
        try {
            const options = {
                name: 'Manual Setup Corp',
                subdomain: 'manual-setup',
                isActive: true,
                skipSystemRoles: true,
            };
            const result = await this.tenantService.createTenant(options);
            this.logger.log(`Tenant created without system roles:`);
            this.logger.log(`- Tenant ID: ${result.tenant.id}`);
            this.logger.log(`- System Roles: ${result.systemRoles.totalRoles} (skipped)`);
            this.logger.log(`- Custom Roles: ${result.customRoles.totalRoles}`);
            this.logger.log('Initializing roles manually...');
            const initResult = await this.tenantService.initializeRolesForTenant(result.tenant.id);
            this.logger.log(`Roles initialized:`);
            this.logger.log(`- System Roles: ${initResult.systemRoles.totalRoles}`);
            this.logger.log(`- Custom Roles: ${initResult.customRoles.totalRoles}`);
        }
        catch (error) {
            this.logger.error('Failed to create tenant without system roles:', error);
            throw error;
        }
    }
    async initializeRolesForExistingTenant(tenantId) {
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
        }
        catch (error) {
            this.logger.error(`Failed to initialize roles for tenant ${tenantId}:`, error);
            throw error;
        }
    }
    async completeTenantSetupWorkflow(tenantName, subdomain, adminUserId) {
        this.logger.log(`Starting complete tenant setup workflow for: ${tenantName}`);
        try {
            const options = {
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
            if (adminUserId) {
                this.logger.log(`Admin user ${adminUserId} should be assigned to Admin role in tenant ${tenantId}`);
            }
            this.logger.log('Tenant setup workflow completed successfully');
            this.logger.log('Available roles:');
            this.logger.log('- System roles: Admin, Operator, Viewer');
            this.logger.log('- Custom roles: Department Manager');
            if (result.customRoles.totalRoles > 1) {
                this.logger.log('- Additional custom roles from configuration');
            }
            return tenantId;
        }
        catch (error) {
            this.logger.error(`Failed to complete tenant setup workflow for ${tenantName}:`, error);
            throw error;
        }
    }
    async demonstrateErrorHandling() {
        this.logger.log('Demonstrating error handling in tenant creation');
        try {
            await this.tenantService.createTenant({
                name: 'Duplicate Name',
                subdomain: 'duplicate-1',
            });
            await this.tenantService.createTenant({
                name: 'Duplicate Name',
                subdomain: 'duplicate-2',
            });
        }
        catch (error) {
            this.logger.warn('Expected error for duplicate tenant name:', error.message);
        }
        try {
            await this.tenantService.createTenant({
                name: 'Invalid Subdomain Test',
                subdomain: 'Invalid_Subdomain!',
            });
        }
        catch (error) {
            this.logger.warn('Expected error for invalid subdomain:', error.message);
        }
        try {
            await this.tenantService.initializeRolesForTenant('non-existent-tenant-id');
        }
        catch (error) {
            this.logger.warn('Expected error for non-existent tenant:', error.message);
        }
        this.logger.log('Error handling demonstration completed');
    }
};
exports.TenantInitializationExample = TenantInitializationExample;
exports.TenantInitializationExample = TenantInitializationExample = TenantInitializationExample_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_service_1.TenantService])
], TenantInitializationExample);
//# sourceMappingURL=tenant-initialization.example.js.map