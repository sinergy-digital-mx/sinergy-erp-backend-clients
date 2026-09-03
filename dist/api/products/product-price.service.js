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
exports.ProductPriceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_price_entity_1 = require("../../entities/products/product-price.entity");
const product_entity_1 = require("../../entities/products/product.entity");
const unit_amount_util_1 = require("../../common/utils/unit-amount.util");
let ProductPriceService = class ProductPriceService {
    productPriceRepository;
    productRepository;
    constructor(productPriceRepository, productRepository) {
        this.productPriceRepository = productPriceRepository;
        this.productRepository = productRepository;
    }
    calculateTotals(price, iva_percentage, ieps_percentage) {
        const subtotal = price;
        const iva_unit_total = (price * iva_percentage) / 100;
        const ieps_unit_total = (price * ieps_percentage) / 100;
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
        const productUoM = await this.productPriceRepository.manager.findOne('ProductUoM', {
            where: { id: dto.product_uom_id, product_id: productId },
        });
        if (!productUoM) {
            throw new common_1.NotFoundException('La UOM especificada no pertenece a este producto');
        }
        const existing = await this.productPriceRepository.findOne({
            where: {
                product_id: productId,
                price_list_id: dto.price_list_id,
                product_uom_id: dto.product_uom_id,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Ya existe un precio para esta lista y UOM en este producto');
        }
        const price = (0, unit_amount_util_1.roundUnitAmount)(dto.price);
        const totals = this.calculateTotals(price, dto.iva_percentage, dto.ieps_percentage);
        const productPrice = this.productPriceRepository.create({
            ...dto,
            price,
            ...totals,
            product_id: productId,
        });
        const saved = await this.productPriceRepository.save(productPrice);
        const result = await this.productPriceRepository.findOne({
            where: { id: saved.id },
            relations: ['price_list', 'product_uom', 'product_uom.uom'],
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
        return await this.productPriceRepository.find({
            where: { product_id: productId },
            relations: ['price_list', 'product_uom', 'product_uom.uom'],
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
        const productPrice = await this.productPriceRepository.findOne({
            where: { id, product_id: productId },
            relations: ['price_list', 'product_uom', 'product_uom.uom'],
        });
        if (!productPrice) {
            throw new common_1.NotFoundException(`Precio con ID ${id} no encontrado`);
        }
        return productPrice;
    }
    async update(id, productId, dto, tenantId) {
        const productPrice = await this.findOne(id, productId, tenantId);
        const price = (0, unit_amount_util_1.roundUnitAmount)(dto.price ?? productPrice.price);
        const totals = this.calculateTotals(price, dto.iva_percentage ?? productPrice.iva_percentage, dto.ieps_percentage ?? productPrice.ieps_percentage);
        Object.assign(productPrice, dto, totals, { price });
        return await this.productPriceRepository.save(productPrice);
    }
    async remove(id, productId, tenantId) {
        const productPrice = await this.findOne(id, productId, tenantId);
        await this.productPriceRepository.remove(productPrice);
    }
};
exports.ProductPriceService = ProductPriceService;
exports.ProductPriceService = ProductPriceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_price_entity_1.ProductPrice)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProductPriceService);
//# sourceMappingURL=product-price.service.js.map