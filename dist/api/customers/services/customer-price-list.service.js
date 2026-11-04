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
exports.CustomerPriceListService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_price_list_entity_1 = require("../../../entities/customers/customer-price-list.entity");
const customer_entity_1 = require("../../../entities/customers/customer.entity");
const price_list_entity_1 = require("../../../entities/products/price-list.entity");
const customer_price_list_util_1 = require("../utils/customer-price-list.util");
let CustomerPriceListService = class CustomerPriceListService {
    assignmentRepo;
    customerRepo;
    priceListRepo;
    constructor(assignmentRepo, customerRepo, priceListRepo) {
        this.assignmentRepo = assignmentRepo;
        this.customerRepo = customerRepo;
        this.priceListRepo = priceListRepo;
    }
    async list(customerId, tenantId) {
        await this.requireCustomer(customerId, tenantId);
        return { price_lists: await this.loadViews(customerId, tenantId) };
    }
    async replace(customerId, tenantId, items) {
        await this.requireCustomer(customerId, tenantId);
        const normalized = (0, customer_price_list_util_1.normalizeCustomerPriceListAssignments)(items);
        if (normalized.length > 0) {
            const lists = await this.priceListRepo.find({
                where: {
                    tenant_id: tenantId,
                    id: (0, typeorm_2.In)(normalized.map((item) => item.price_list_id)),
                },
            });
            if (lists.length !== normalized.length) {
                throw new common_1.BadRequestException('Una de las listas de precios no existe');
            }
            const inactive = lists.find((list) => !list.is_active);
            if (inactive) {
                throw new common_1.BadRequestException(`La lista ${inactive.name} no está activa`);
            }
        }
        await this.assignmentRepo.manager.transaction(async (manager) => {
            await manager.delete(customer_price_list_entity_1.CustomerPriceList, {
                tenant_id: tenantId,
                customer_id: customerId,
            });
            if (normalized.length === 0)
                return;
            await manager.save(customer_price_list_entity_1.CustomerPriceList, normalized.map((item) => manager.create(customer_price_list_entity_1.CustomerPriceList, {
                tenant_id: tenantId,
                customer_id: customerId,
                price_list_id: item.price_list_id,
                is_default: item.is_default,
            })));
        });
        return { price_lists: await this.loadViews(customerId, tenantId) };
    }
    async requireCustomer(customerId, tenantId) {
        const customer = await this.customerRepo.findOneBy({
            id: customerId,
            tenant_id: tenantId,
        });
        if (!customer) {
            throw new common_1.NotFoundException('Cliente no encontrado');
        }
    }
    async loadViews(customerId, tenantId) {
        const rows = await this.assignmentRepo.find({
            where: { tenant_id: tenantId, customer_id: customerId },
            relations: { price_list: true },
            order: { is_default: 'DESC', created_at: 'ASC' },
        });
        return rows.map((row) => ({
            id: row.id,
            price_list_id: row.price_list_id,
            name: row.price_list?.name ?? '',
            is_default: row.is_default === true,
            is_active: row.price_list?.is_active !== false,
        }));
    }
};
exports.CustomerPriceListService = CustomerPriceListService;
exports.CustomerPriceListService = CustomerPriceListService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_price_list_entity_1.CustomerPriceList)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(2, (0, typeorm_1.InjectRepository)(price_list_entity_1.PriceList)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CustomerPriceListService);
//# sourceMappingURL=customer-price-list.service.js.map