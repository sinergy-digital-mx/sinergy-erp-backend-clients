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
exports.PurchaseOrderLocationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const billing_branch_entity_1 = require("../../../entities/billing/billing-branch.entity");
const fiscal_configuration_entity_1 = require("../../../entities/billing/fiscal-configuration.entity");
const warehouse_entity_1 = require("../../../entities/warehouse/warehouse.entity");
const purchase_order_location_util_1 = require("../utils/purchase-order-location.util");
let PurchaseOrderLocationsService = class PurchaseOrderLocationsService {
    fiscalConfigRepository;
    billingBranchRepository;
    warehouseRepository;
    constructor(fiscalConfigRepository, billingBranchRepository, warehouseRepository) {
        this.fiscalConfigRepository = fiscalConfigRepository;
        this.billingBranchRepository = billingBranchRepository;
        this.warehouseRepository = warehouseRepository;
    }
    async getLocationTree(tenantId) {
        const [fiscals, branches, warehouses] = await Promise.all([
            this.fiscalConfigRepository.find({
                where: { tenant_id: tenantId },
                order: { created_at: 'ASC' },
            }),
            this.billingBranchRepository
                .createQueryBuilder('branch')
                .innerJoin('branch.fiscal_configuration', 'fc')
                .where('fc.tenant_id = :tenantId', { tenantId })
                .orderBy('branch.code', 'ASC')
                .getMany(),
            this.warehouseRepository.find({
                where: { tenant_id: tenantId },
                order: { name: 'ASC' },
            }),
        ]);
        return (0, purchase_order_location_util_1.buildPurchaseOrderLocationTree)(fiscals, branches, warehouses);
    }
};
exports.PurchaseOrderLocationsService = PurchaseOrderLocationsService;
exports.PurchaseOrderLocationsService = PurchaseOrderLocationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(fiscal_configuration_entity_1.FiscalConfiguration)),
    __param(1, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(2, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PurchaseOrderLocationsService);
//# sourceMappingURL=purchase-order-locations.service.js.map