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
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../../entities/products/product.entity");
const s3_service_1 = require("../../common/services/s3.service");
let ProductService = class ProductService {
    productRepository;
    s3Service;
    constructor(productRepository, s3Service) {
        this.productRepository = productRepository;
        this.s3Service = s3Service;
    }
    resolveSatClave(dto) {
        if (dto.sat_clave !== undefined)
            return dto.sat_clave;
        if (dto.sat_code !== undefined)
            return dto.sat_code;
        return undefined;
    }
    extractAllowedProductFields(dto) {
        const satClave = this.resolveSatClave(dto);
        return {
            ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
            ...(dto.external_sku !== undefined ? { external_sku: dto.external_sku } : {}),
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.description !== undefined ? { description: dto.description } : {}),
            ...(dto.category_id !== undefined ? { category_id: dto.category_id } : {}),
            ...(dto.subcategory_id !== undefined ? { subcategory_id: dto.subcategory_id } : {}),
            ...(satClave !== undefined ? { sat_clave: satClave } : {}),
        };
    }
    async create(dto, tenantId) {
        const existing = await this.productRepository.findOne({
            where: { tenant_id: tenantId, sku: dto.sku },
        });
        if (existing) {
            throw new common_1.ConflictException(`Producto con SKU "${dto.sku}" ya existe para este tenant`);
        }
        if (dto.external_sku) {
            const existingExternalSku = await this.productRepository.findOne({
                where: { tenant_id: tenantId, external_sku: dto.external_sku },
            });
            if (existingExternalSku) {
                throw new common_1.ConflictException(`Producto con SKU externo "${dto.external_sku}" ya existe para este tenant`);
            }
        }
        const product = this.productRepository.create({
            ...this.extractAllowedProductFields(dto),
            tenant_id: tenantId,
            is_active: true,
        });
        return await this.productRepository.save(product);
    }
    async findAll(query, tenantId) {
        let page = Number(query.page) || 1;
        let limit = Number(query.limit) || 10;
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 1;
        if (limit > 100)
            limit = 100;
        const skip = (page - 1) * limit;
        const { search, sku, external_sku, name, category_id, subcategory_id, is_active } = query;
        const queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.subcategory', 'subcategory')
            .where('product.tenant_id = :tenantId', { tenantId });
        if (search?.trim()) {
            const term = `%${search.trim()}%`;
            queryBuilder.andWhere(`(LOWER(product.name) LIKE LOWER(:search)
          OR LOWER(product.sku) LIKE LOWER(:search)
          OR LOWER(product.external_sku) LIKE LOWER(:search))`, { search: term });
        }
        if (sku) {
            queryBuilder.andWhere('product.sku LIKE :sku', { sku: `%${sku}%` });
        }
        if (external_sku) {
            queryBuilder.andWhere('product.external_sku LIKE :externalSku', {
                externalSku: `%${external_sku}%`,
            });
        }
        if (name) {
            queryBuilder.andWhere('product.name LIKE :name', { name: `%${name}%` });
        }
        if (category_id) {
            queryBuilder.andWhere('product.category_id = :categoryId', { categoryId: category_id });
        }
        if (subcategory_id) {
            queryBuilder.andWhere('product.subcategory_id = :subcategoryId', {
                subcategoryId: subcategory_id,
            });
        }
        if (is_active !== undefined) {
            queryBuilder.andWhere('product.is_active = :isActive', { isActive: is_active });
        }
        const [data, total] = await queryBuilder
            .orderBy('product.name', 'ASC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        const dataWithPhotoUrls = await Promise.all(data.map((product) => this.toResponseWithPhotoUrl(product)));
        return {
            data: dataWithPhotoUrls,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id, tenantId) {
        const product = await this.getByIdOrFail(id, tenantId);
        return this.toResponseWithPhotoUrl(product);
    }
    async update(id, dto, tenantId) {
        const product = await this.getByIdOrFail(id, tenantId);
        if (dto.sku && dto.sku !== product.sku) {
            const existing = await this.productRepository.findOne({
                where: { tenant_id: tenantId, sku: dto.sku },
            });
            if (existing) {
                throw new common_1.ConflictException(`Producto con SKU "${dto.sku}" ya existe para este tenant`);
            }
        }
        if (dto.external_sku && dto.external_sku !== product.external_sku) {
            const existingExternalSku = await this.productRepository.findOne({
                where: { tenant_id: tenantId, external_sku: dto.external_sku },
            });
            if (existingExternalSku) {
                throw new common_1.ConflictException(`Producto con SKU externo "${dto.external_sku}" ya existe para este tenant`);
            }
        }
        await this.productRepository.update({ id, tenant_id: tenantId }, this.extractAllowedProductFields(dto));
        return await this.findOne(id, tenantId);
    }
    async toggleStatus(id, dto, tenantId) {
        const product = await this.getByIdOrFail(id, tenantId);
        product.is_active = dto.is_active;
        const saved = await this.productRepository.save(product);
        return this.toResponseWithPhotoUrl(saved);
    }
    async remove(id, tenantId) {
        const product = await this.getByIdOrFail(id, tenantId);
        await this.productRepository.remove(product);
    }
    async uploadPhoto(id, tenantId, file) {
        const product = await this.getByIdOrFail(id, tenantId);
        if (product.photo) {
            await this.s3Service.deleteFile(product.photo).catch(() => undefined);
        }
        const s3Key = await this.s3Service.uploadEntityFile(tenantId, 'products', id, 'photo', file.buffer, file.originalname, file.mimetype);
        product.photo = s3Key;
        const saved = await this.productRepository.save(product);
        return this.toResponseWithPhotoUrl(saved);
    }
    async getByIdOrFail(id, tenantId) {
        const product = await this.productRepository.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['category', 'subcategory'],
        });
        if (!product) {
            throw new common_1.NotFoundException(`Producto con ID ${id} no encontrado`);
        }
        return product;
    }
    async toResponseWithPhotoUrl(product) {
        let photo = product.photo;
        if (photo) {
            photo = await this.s3Service
                .getSignedUrl(photo, 900)
                .catch(() => product.photo);
        }
        return {
            ...product,
            photo,
            sat_code: product.sat_clave ?? null,
        };
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        s3_service_1.S3Service])
], ProductService);
//# sourceMappingURL=product.service.js.map