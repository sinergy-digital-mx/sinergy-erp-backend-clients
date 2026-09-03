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
exports.ProductVendorCostService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_vendor_cost_entity_1 = require("../../entities/products/product-vendor-cost.entity");
const product_entity_1 = require("../../entities/products/product.entity");
const unit_amount_util_1 = require("../../common/utils/unit-amount.util");
let ProductVendorCostService = class ProductVendorCostService {
    productVendorCostRepository;
    productRepository;
    constructor(productVendorCostRepository, productRepository) {
        this.productVendorCostRepository = productVendorCostRepository;
        this.productRepository = productRepository;
    }
    roundUnitCost(cost) {
        return (0, unit_amount_util_1.roundUnitAmount)(cost);
    }
    calculateTotals(cost, iva_percentage, ieps_percentage) {
        const subtotal = cost;
        const iva_unit_total = (cost * iva_percentage) / 100;
        const ieps_unit_total = (cost * ieps_percentage) / 100;
        const total = subtotal + iva_unit_total + ieps_unit_total;
        return {
            subtotal: Number(subtotal.toFixed(2)),
            iva_unit_total: Number(iva_unit_total.toFixed(2)),
            ieps_unit_total: Number(ieps_unit_total.toFixed(2)),
            total: Number(total.toFixed(2)),
        };
    }
    async create(productId, dto, tenantId) {
        const product = await this.productRepository.findOne({
            where: { id: productId, tenant_id: tenantId },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Producto con ID ${productId} no encontrado`);
        }
        const productUoM = await this.productVendorCostRepository.manager.findOne('ProductUoM', {
            where: { id: dto.product_uom_id, product_id: productId },
        });
        if (!productUoM) {
            throw new common_1.NotFoundException('La UOM especificada no pertenece a este producto');
        }
        const existing = await this.productVendorCostRepository.findOne({
            where: {
                product_id: productId,
                vendor_id: dto.vendor_id,
                product_uom_id: dto.product_uom_id,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Ya existe un costo para este proveedor y UOM en este producto');
        }
        const cost = this.roundUnitCost(dto.cost);
        const totals = this.calculateTotals(cost, dto.iva_percentage, dto.ieps_percentage);
        const vendorCost = this.productVendorCostRepository.create({
            ...dto,
            cost,
            ...totals,
            product_id: productId,
            currency: dto.currency || 'MXN',
        });
        const saved = await this.productVendorCostRepository.save(vendorCost);
        const result = await this.productVendorCostRepository.findOne({
            where: { id: saved.id },
            relations: ['vendor', 'product_uom', 'product_uom.uom'],
        });
        return result;
    }
    async findAll(productId, tenantId) {
        const product = await this.productRepository.findOne({
            where: { id: productId, tenant_id: tenantId },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Producto con ID ${productId} no encontrado`);
        }
        return await this.productVendorCostRepository.find({
            where: { product_id: productId },
            relations: ['vendor', 'product_uom', 'product_uom.uom'],
            order: { created_at: 'ASC' },
        });
    }
    async findOne(id, productId, tenantId) {
        const product = await this.productRepository.findOne({
            where: { id: productId, tenant_id: tenantId },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Producto con ID ${productId} no encontrado`);
        }
        const vendorCost = await this.productVendorCostRepository.findOne({
            where: { id, product_id: productId },
            relations: ['vendor', 'product_uom', 'product_uom.uom'],
        });
        if (!vendorCost) {
            throw new common_1.NotFoundException(`Costo con ID ${id} no encontrado`);
        }
        return vendorCost;
    }
    async update(id, productId, dto, tenantId) {
        const vendorCost = await this.findOne(id, productId, tenantId);
        const cost = this.roundUnitCost(dto.cost !== undefined ? dto.cost : Number(vendorCost.cost));
        const totals = this.calculateTotals(cost, dto.iva_percentage ?? vendorCost.iva_percentage, dto.ieps_percentage ?? vendorCost.ieps_percentage);
        Object.assign(vendorCost, dto, totals, { cost });
        return await this.productVendorCostRepository.save(vendorCost);
    }
    async remove(id, productId, tenantId) {
        const vendorCost = await this.findOne(id, productId, tenantId);
        await this.productVendorCostRepository.remove(vendorCost);
    }
};
exports.ProductVendorCostService = ProductVendorCostService;
exports.ProductVendorCostService = ProductVendorCostService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_vendor_cost_entity_1.ProductVendorCost)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProductVendorCostService);
//# sourceMappingURL=product-vendor-cost.service.js.map