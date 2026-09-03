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
exports.ContractsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const contracts_service_1 = require("./contracts.service");
const contracts_export_service_1 = require("./contracts-export.service");
const contract_pdf_service_1 = require("./contract-pdf.service");
const create_contract_dto_1 = require("./dto/create-contract.dto");
const update_contract_dto_1 = require("./dto/update-contract.dto");
const query_contracts_dto_1 = require("./dto/query-contracts.dto");
let ContractsController = class ContractsController {
    contractsService;
    contractsExportService;
    contractPdfService;
    tenantContext;
    constructor(contractsService, contractsExportService, contractPdfService, tenantContext) {
        this.contractsService = contractsService;
        this.contractsExportService = contractsExportService;
        this.contractPdfService = contractPdfService;
        this.tenantContext = tenantContext;
    }
    async create(req, dto) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.contractsService.create(tenantId, dto);
    }
    async findAll(req, query) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const pageNum = query.page ?? 1;
        const limitNum = query.limit ?? 20;
        return this.contractsService.findAll(tenantId, this.toContractFilters(query), pageNum, limitNum);
    }
    async getStats(req, query) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.contractsService.getContractStats(tenantId, this.toContractFilters(query));
    }
    async findByNumber(contractNumber, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.contractsService.findByContractNumber(tenantId, contractNumber);
    }
    async generatePdf(id, req, res) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const buffer = await this.contractPdfService.generateContractPdf(tenantId, id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="estado-cuenta-${id}.pdf"`);
        res.send(buffer);
    }
    async findOne(id, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.contractsService.findOne(tenantId, id);
    }
    async update(id, dto, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.contractsService.update(tenantId, id, dto);
    }
    async remove(id, req) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        await this.contractsService.remove(tenantId, id);
        return { success: true };
    }
    async exportToExcel(req, res, query) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const buffer = await this.contractsExportService.exportToExcel(tenantId, this.toContractFilters(query));
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="contratos.xlsx"');
        res.send(buffer);
    }
    toContractFilters(query) {
        return {
            customerId: query.customerId,
            propertyId: query.propertyId,
            status: query.status,
            hasOverdue: query.hasOverdue === true,
            search: query.search,
            group_id: query.group_id,
        };
    }
};
exports.ContractsController = ContractsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Create' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_contract_dto_1.CreateContractDto]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Read' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_contracts_dto_1.QueryContractsDto]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Read' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_contracts_dto_1.QueryContractsDto]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('by-number/:contractNumber'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Read' }),
    __param(0, (0, common_1.Param)('contractNumber')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "findByNumber", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Read' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Response)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "generatePdf", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Read' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Update' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_contract_dto_1.UpdateContractDto, Object]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Delete' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('export/excel'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Contract', action: 'Read' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Response)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, query_contracts_dto_1.QueryContractsDto]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "exportToExcel", null);
exports.ContractsController = ContractsController = __decorate([
    (0, common_1.Controller)('tenant/contracts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [contracts_service_1.ContractsService,
        contracts_export_service_1.ContractsExportService,
        contract_pdf_service_1.ContractPdfService,
        tenant_context_service_1.TenantContextService])
], ContractsController);
//# sourceMappingURL=contracts.controller.js.map