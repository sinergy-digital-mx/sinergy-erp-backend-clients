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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const customers_service_1 = require("./customers.service");
const create_customer_dto_1 = require("./dto/create-customer.dto");
const update_customer_dto_1 = require("./dto/update-customer.dto");
const query_customers_dto_1 = require("./dto/query-customers.dto");
const query_customers_export_dto_1 = require("./dto/query-customers-export.dto");
const customer_address_dto_1 = require("./dto/customer-address.dto");
const customers_export_service_1 = require("./services/customers-export.service");
const customer_product_insights_service_1 = require("./services/customer-product-insights.service");
const query_customer_product_insights_dto_1 = require("./dto/query-customer-product-insights.dto");
const customer_groups_service_1 = require("./customer-groups.service");
const check_customer_duplicates_dto_1 = require("./dto/check-customer-duplicates.dto");
const upsert_customer_credit_dto_1 = require("./dto/upsert-customer-credit.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
let CustomersController = class CustomersController {
    customersService;
    exportService;
    productInsightsService;
    customerGroupsService;
    constructor(customersService, exportService, productInsightsService, customerGroupsService) {
        this.customersService = customersService;
        this.exportService = exportService;
        this.productInsightsService = productInsightsService;
        this.customerGroupsService = customerGroupsService;
    }
    create(dto, req) {
        return this.customersService.create(dto, req.user.tenantId, req.user.id ?? req.user.user_id);
    }
    checkDuplicates(dto, req) {
        return this.customersService.findDuplicates(dto, req.user.tenantId);
    }
    update(id, dto, req) {
        return this.customersService.update(Number(id), dto, req.user.tenantId, req.user.id ?? req.user.user_id);
    }
    findAllStatuses() {
        return this.customersService.findAllStatuses();
    }
    findGroups(req) {
        return this.customerGroupsService.findOptions(req.user.tenant_id ?? req.user.tenantId);
    }
    getRegistrationOptions(req) {
        return this.customersService.getRegistrationOptions(req.user.tenant_id ?? req.user.tenantId);
    }
    async exportExcel(query, req, res) {
        const buffer = await this.exportService.exportCustomers(req.user.tenantId, query);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${this.exportService.getFilename()}"`);
        res.send(buffer);
    }
    async findAll(query, req) {
        return this.customersService.findAll(req.user.tenantId, query);
    }
    getAssignmentHistory(id, req) {
        return this.customersService.getAssignmentHistory(Number(id), req.user.tenant_id ?? req.user.tenantId);
    }
    listCredits(id, req) {
        return this.customersService.listCredits(Number(id), req.user.tenantId);
    }
    upsertCredits(id, dto, req) {
        return this.customersService.upsertCredits(Number(id), dto, req.user.tenantId);
    }
    findOne(id, fiscalConfigurationId, req) {
        return this.customersService.findOne(Number(id), req.user.tenantId, fiscalConfigurationId);
    }
    getProductInsights(id, query, req) {
        return this.productInsightsService.getInsights(Number(id), req.user.tenant_id ?? req.user.tenantId, query);
    }
    remove(id, req) {
        throw new Error('Delete functionality not yet implemented in service');
    }
    async getAddresses(id, req) {
        const customer = await this.customersService.findOneWithAddresses(Number(id), req.user.tenantId);
        return customer?.addresses || [];
    }
    async createAddress(id, dto, req) {
        return this.customersService.createAddress(Number(id), dto, req.user.tenant_id ?? req.user.tenantId);
    }
    async updateAddress(id, addressId, dto, req) {
        return this.customersService.updateAddress(Number(id), Number(addressId), dto, req.user.tenant_id ?? req.user.tenantId);
    }
    async getActivities(id, req) {
        const customer = await this.customersService.findOneWithActivities(Number(id), req.user.tenantId);
        return customer?.activities || [];
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new customer' }),
    (0, swagger_1.ApiBody)({ type: create_customer_dto_1.CreateCustomerDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Customer created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_customer_dto_1.CreateCustomerDto, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('duplicates'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Create' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar clientes similares por correo, teléfono, nombre+apellido o RFC',
    }),
    (0, swagger_1.ApiBody)({ type: check_customer_duplicates_dto_1.CheckCustomerDuplicatesDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Coincidencias encontradas (puede estar vacío)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_customer_duplicates_dto_1.CheckCustomerDuplicatesDto, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "checkDuplicates", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update an existing customer' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: 'Customer ID' }),
    (0, swagger_1.ApiBody)({ type: update_customer_dto_1.UpdateCustomerDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found - Customer does not exist' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_customer_dto_1.UpdateCustomerDto, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "update", null);
__decorate([
    (0, common_1.Get)('statuses'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Listar estatus disponibles para clientes' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Catálogo de estatus obtenido' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "findAllStatuses", null);
__decorate([
    (0, common_1.Get)('groups'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Catálogo de grupos de clientes de esta organización (filtro y select)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Grupos de esta organización' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "findGroups", null);
__decorate([
    (0, common_1.Get)('registration-options'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Catálogo de razones sociales, sucursales y vendedores para el tab Registro',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Razones sociales, sucursales y usuarios de esta organización' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "getRegistrationOptions", null);
__decorate([
    (0, common_1.Get)('export/excel'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Descargar Excel de clientes' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Archivo Excel generado' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_customers_export_dto_1.QueryCustomersExportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "exportExcel", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated customers with search and filters' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number (1-based)', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)', example: 20 }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String, description: 'Search by name, email, phone, company, RFC, fiscal name, etc.' }),
    (0, swagger_1.ApiQuery)({ name: 'status_id', required: false, type: Number, description: 'Filter by status ID' }),
    (0, swagger_1.ApiQuery)({ name: 'group_id', required: false, type: String, description: 'Filter by customer group ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of customers retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_customers_dto_1.QueryCustomersDto, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/assignment-history'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Historial de asignaciones del cliente',
        description: 'Cambios de vendedor asignado, razón y sucursal de registro. Quién, cuándo y de → a. Solo en el cliente, no en la orden de venta. También viene en GET /customers/:id como assignment_history.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: 'Customer ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "getAssignmentHistory", null);
__decorate([
    (0, common_1.Get)(':id/credits'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Crédito del cliente por razón social (no por almacén)',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: 'Customer ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "listCredits", null);
__decorate([
    (0, common_1.Put)(':id/credits'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Activar o editar crédito por razón social',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: 'Customer ID' }),
    (0, swagger_1.ApiBody)({ type: upsert_customer_credit_dto_1.UpsertCustomerCreditsDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upsert_customer_credit_dto_1.UpsertCustomerCreditsDto, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "upsertCredits", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific customer by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: 'Customer ID' }),
    (0, swagger_1.ApiQuery)({
        name: 'fiscal_configuration_id',
        required: false,
        description: 'Razón social de la OV/POS para aplanar el snapshot de crédito',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found - Customer does not exist' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('fiscal_configuration_id')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/product-insights'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Productos más comprados y sugerencias (misma categoría/subcategoría) para el detalle del cliente',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: 'Customer ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_customer_product_insights_dto_1.QueryCustomerProductInsightsDto, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "getProductInsights", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Delete' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a customer by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: 'Customer ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found - Customer does not exist' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/addresses'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get all addresses for a customer' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: 'Customer ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer addresses retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found - Customer does not exist' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getAddresses", null);
__decorate([
    (0, common_1.Post)(':id/addresses'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Crear dirección de cliente (con o sin GPS)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_address_dto_1.CreateCustomerAddressDto, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "createAddress", null);
__decorate([
    (0, common_1.Put)(':id/addresses/:addressId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar dirección de cliente (recalcula has_gps)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('addressId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, customer_address_dto_1.UpdateCustomerAddressDto, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "updateAddress", null);
__decorate([
    (0, common_1.Get)(':id/activities'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'customers', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get all activities for a customer' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: 'Customer ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer activities retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found - Customer does not exist' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getActivities", null);
exports.CustomersController = CustomersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, common_1.Controller)('tenant/customers'),
    (0, swagger_1.ApiTags)('Customers'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [customers_service_1.CustomersService,
        customers_export_service_1.CustomersExportService,
        customer_product_insights_service_1.CustomerProductInsightsService,
        customer_groups_service_1.CustomerGroupsService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map