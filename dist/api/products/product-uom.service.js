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
exports.ProductUoMService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_uom_entity_1 = require("../../entities/products/product-uom.entity");
const product_entity_1 = require("../../entities/products/product.entity");
const uom_catalog_service_1 = require("../uom-catalog/uom-catalog.service");
let ProductUoMService = class ProductUoMService {
    productUoMRepository;
    productRepository;
    uomCatalogService;
    constructor(productUoMRepository, productRepository, uomCatalogService) {
        this.productUoMRepository = productUoMRepository;
        this.productRepository = productRepository;
        this.uomCatalogService = uomCatalogService;
    }
    async create(productId, dto, tenantId) {
        const product = await this.productRepository.findOne({
            where: { id: productId, tenant_id: tenantId },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Producto con ID ${productId} no encontrado`);
        }
        const existing = await this.productUoMRepository.findOne({
            where: { product_id: productId, uom_catalog_id: dto.uom_catalog_id },
        });
        if (existing) {
            throw new common_1.ConflictException('Esta UoM ya está asignada a este producto');
        }
        if (dto.is_base) {
            const existingBase = await this.productUoMRepository.findOne({
                where: { product_id: productId, is_base: true },
            });
            if (existingBase) {
                throw new common_1.ConflictException('Ya existe una UoM base para este producto');
            }
        }
        const parentUomCatalogId = await this.resolveParentUomCatalogId(productId, dto.parent_uom_id, dto.uom_catalog_id, tenantId);
        const productUoM = this.productUoMRepository.create({
            uom_catalog_id: dto.uom_catalog_id,
            factor: dto.factor,
            is_base: dto.is_base,
            parent_uom_id: parentUomCatalogId,
            product_id: productId,
        });
        return await this.productUoMRepository.save(productUoM);
    }
    async findCatalogForProduct(productId, query, tenantId) {
        const product = await this.productRepository.findOne({
            where: { id: productId, tenant_id: tenantId },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Producto con ID ${productId} no encontrado`);
        }
        return this.uomCatalogService.findAll(query, tenantId);
    }
    async findAll(productId, tenantId) {
        const product = await this.productRepository.findOne({
            where: { id: productId, tenant_id: tenantId },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Producto con ID ${productId} no encontrado`);
        }
        return await this.productUoMRepository.find({
            where: { product_id: productId },
            relations: ['uom', 'parent_uom'],
            order: { is_base: 'DESC', created_at: 'ASC' },
        });
    }
    async findOne(id, productId, tenantId) {
        const product = await this.productRepository.findOne({
            where: { id: productId, tenant_id: tenantId },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Producto con ID ${productId} no encontrado`);
        }
        const productUoM = await this.productUoMRepository.findOne({
            where: { id, product_id: productId },
            relations: ['uom', 'parent_uom'],
        });
        if (!productUoM) {
            throw new common_1.NotFoundException(`UoM con ID ${id} no encontrada para este producto`);
        }
        return productUoM;
    }
    async update(id, productId, dto, tenantId) {
        const productUoM = await this.findOne(id, productId, tenantId);
        if (dto.is_base && !productUoM.is_base) {
            const existingBase = await this.productUoMRepository.findOne({
                where: { product_id: productId, is_base: true },
            });
            if (existingBase) {
                throw new common_1.ConflictException('Ya existe una UoM base para este producto');
            }
        }
        if (dto.uom_catalog_id !== undefined && dto.uom_catalog_id !== productUoM.uom_catalog_id) {
            await this.uomCatalogService.findOne(dto.uom_catalog_id, tenantId);
            const duplicate = await this.productUoMRepository.findOne({
                where: { product_id: productId, uom_catalog_id: dto.uom_catalog_id },
            });
            if (duplicate && duplicate.id !== id) {
                throw new common_1.ConflictException('Esta UoM del catálogo ya está asignada a este producto');
            }
        }
        const patch = {};
        if (dto.uom_catalog_id !== undefined)
            patch.uom_catalog_id = dto.uom_catalog_id;
        if (dto.factor !== undefined)
            patch.factor = dto.factor;
        if (dto.is_base !== undefined)
            patch.is_base = dto.is_base;
        if (dto.parent_uom_id !== undefined) {
            const nextCatalogId = dto.uom_catalog_id ?? productUoM.uom_catalog_id;
            patch.parent_uom_id = await this.resolveParentUomCatalogId(productId, dto.parent_uom_id, nextCatalogId, tenantId, id);
        }
        if (Object.keys(patch).length > 0) {
            await this.productUoMRepository.update({ id, product_id: productId }, patch);
        }
        return this.findOne(id, productId, tenantId);
    }
    async remove(id, productId, tenantId) {
        const productUoM = await this.findOne(id, productId, tenantId);
        if (productUoM.is_base) {
            throw new common_1.BadRequestException('No se puede eliminar la UoM base del producto');
        }
        await this.productUoMRepository.remove(productUoM);
    }
    async resolveParentUomCatalogId(productId, parentUomId, childUomCatalogId, tenantId, currentProductUomId) {
        if (parentUomId === undefined || parentUomId === null || parentUomId === '') {
            return null;
        }
        if (currentProductUomId && parentUomId === currentProductUomId) {
            throw new common_1.BadRequestException('Una UoM no puede ser padre de sí misma');
        }
        const parentAsProductUom = await this.productUoMRepository.findOne({
            where: { id: parentUomId, product_id: productId },
        });
        if (parentAsProductUom) {
            if (parentAsProductUom.uom_catalog_id === childUomCatalogId) {
                throw new common_1.BadRequestException('Una UoM no puede ser padre de sí misma');
            }
            return parentAsProductUom.uom_catalog_id;
        }
        try {
            await this.uomCatalogService.findOne(parentUomId, tenantId);
        }
        catch {
            throw new common_1.BadRequestException('parent_uom_id debe ser el id de otra UoM del mismo producto (product_uoms.id) ' +
                'o un id válido del catálogo (uom_catalog.id)');
        }
        if (parentUomId === childUomCatalogId) {
            throw new common_1.BadRequestException('Una UoM no puede ser padre de sí misma');
        }
        return parentUomId;
    }
};
exports.ProductUoMService = ProductUoMService;
exports.ProductUoMService = ProductUoMService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_uom_entity_1.ProductUoM)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        uom_catalog_service_1.UoMCatalogService])
], ProductUoMService);
//# sourceMappingURL=product-uom.service.js.map