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
exports.ProductDiscountService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_discount_entity_1 = require("../../entities/products/product-discount.entity");
const product_entity_1 = require("../../entities/products/product.entity");
const product_discount_util_1 = require("./utils/product-discount.util");
let ProductDiscountService = class ProductDiscountService {
    productDiscountRepository;
    productRepository;
    constructor(productDiscountRepository, productRepository) {
        this.productDiscountRepository = productDiscountRepository;
        this.productRepository = productRepository;
    }
    async assertProductOwnership(productId, tenantId) {
        const product = await this.productRepository.findOne({
            where: { id: productId, tenant_id: tenantId },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Producto con ID ${productId} no encontrado`);
        }
        return product;
    }
    validateDiscountValue(discountType, value) {
        if (value <= 0) {
            throw new common_1.BadRequestException('El valor del descuento debe ser mayor a 0');
        }
        if (discountType === product_discount_entity_1.ProductDiscountType.PERCENTAGE && value > 100) {
            throw new common_1.BadRequestException('El porcentaje de descuento no puede ser mayor a 100');
        }
    }
    validateDateRange(validFrom, validTo) {
        if (validFrom && validTo && new Date(validFrom) > new Date(validTo)) {
            throw new common_1.BadRequestException('valid_from debe ser anterior o igual a valid_to');
        }
    }
    async assertProductUom(productId, productUomId) {
        if (!productUomId)
            return;
        const productUom = await this.productDiscountRepository.manager.findOne('ProductUoM', {
            where: { id: productUomId, product_id: productId },
        });
        if (!productUom) {
            throw new common_1.NotFoundException('La UOM especificada no pertenece a este producto');
        }
    }
    async create(productId, dto, tenantId) {
        await this.assertProductOwnership(productId, tenantId);
        this.validateDiscountValue(dto.discount_type, dto.value);
        this.validateDateRange(dto.valid_from, dto.valid_to);
        await this.assertProductUom(productId, dto.product_uom_id);
        const existing = await this.productDiscountRepository.findOne({
            where: { product_id: productId, name: dto.name.trim() },
        });
        if (existing) {
            throw new common_1.ConflictException('Ya existe un descuento con ese nombre para este producto');
        }
        const discount = this.productDiscountRepository.create({
            ...dto,
            name: dto.name.trim(),
            product_id: productId,
            product_uom_id: dto.product_uom_id ?? null,
            valid_from: dto.valid_from ? new Date(dto.valid_from) : null,
            valid_to: dto.valid_to ? new Date(dto.valid_to) : null,
        });
        const saved = await this.productDiscountRepository.save(discount);
        return this.findOne(saved.id, productId, tenantId);
    }
    async findAll(productId, tenantId) {
        await this.assertProductOwnership(productId, tenantId);
        return this.productDiscountRepository.find({
            where: { product_id: productId },
            relations: ['product_uom', 'product_uom.uom'],
            order: { created_at: 'ASC' },
        });
    }
    async findApplicableForProductUom(productId, productUomId, tenantId) {
        const discounts = await this.findAll(productId, tenantId);
        return discounts
            .filter((discount) => (0, product_discount_util_1.isProductDiscountApplicable)(discount, productUomId))
            .map(product_discount_util_1.mapApplicableProductDiscount);
    }
    async findOne(id, productId, tenantId) {
        await this.assertProductOwnership(productId, tenantId);
        const discount = await this.productDiscountRepository.findOne({
            where: { id, product_id: productId },
            relations: ['product_uom', 'product_uom.uom'],
        });
        if (!discount) {
            throw new common_1.NotFoundException(`Descuento con ID ${id} no encontrado`);
        }
        return discount;
    }
    async findByIdForOrder(id, productId, tenantId) {
        const discount = await this.productDiscountRepository
            .createQueryBuilder('discount')
            .innerJoin('discount.product', 'product')
            .where('discount.id = :id', { id })
            .andWhere('discount.product_id = :productId', { productId })
            .andWhere('product.tenant_id = :tenantId', { tenantId })
            .getOne();
        if (!discount) {
            throw new common_1.NotFoundException(`Descuento con ID ${id} no encontrado`);
        }
        return discount;
    }
    async update(id, productId, dto, tenantId) {
        const discount = await this.findOne(id, productId, tenantId);
        const nextType = dto.discount_type ?? discount.discount_type;
        const nextValue = dto.value ?? Number(discount.value);
        this.validateDiscountValue(nextType, nextValue);
        this.validateDateRange(dto.valid_from ?? (discount.valid_from ? discount.valid_from.toISOString().slice(0, 10) : null), dto.valid_to ?? (discount.valid_to ? discount.valid_to.toISOString().slice(0, 10) : null));
        if (dto.product_uom_id !== undefined) {
            await this.assertProductUom(productId, dto.product_uom_id);
        }
        if (dto.name && dto.name.trim() !== discount.name) {
            const duplicate = await this.productDiscountRepository.findOne({
                where: { product_id: productId, name: dto.name.trim() },
            });
            if (duplicate && duplicate.id !== id) {
                throw new common_1.ConflictException('Ya existe un descuento con ese nombre para este producto');
            }
        }
        Object.assign(discount, {
            ...dto,
            name: dto.name?.trim() ?? discount.name,
            valid_from: dto.valid_from !== undefined
                ? dto.valid_from
                    ? new Date(dto.valid_from)
                    : null
                : discount.valid_from,
            valid_to: dto.valid_to !== undefined
                ? dto.valid_to
                    ? new Date(dto.valid_to)
                    : null
                : discount.valid_to,
            product_uom_id: dto.product_uom_id !== undefined ? dto.product_uom_id ?? null : discount.product_uom_id,
        });
        await this.productDiscountRepository.save(discount);
        return this.findOne(id, productId, tenantId);
    }
    async remove(id, productId, tenantId) {
        const discount = await this.findOne(id, productId, tenantId);
        await this.productDiscountRepository.remove(discount);
    }
};
exports.ProductDiscountService = ProductDiscountService;
exports.ProductDiscountService = ProductDiscountService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_discount_entity_1.ProductDiscount)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProductDiscountService);
//# sourceMappingURL=product-discount.service.js.map