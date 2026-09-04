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
const product_uom_entity_1 = require("../../entities/products/product-uom.entity");
const product_price_entity_1 = require("../../entities/products/product-price.entity");
const product_discount_entity_1 = require("../../entities/products/product-discount.entity");
const product_item_kind_enum_1 = require("../../entities/products/product-item-kind.enum");
const s3_service_1 = require("../../common/services/s3.service");
const uom_catalog_service_1 = require("../uom-catalog/uom-catalog.service");
const product_search_rank_util_1 = require("../inventory/utils/product-search-rank.util");
const product_discount_util_1 = require("./utils/product-discount.util");
let ProductService = class ProductService {
    productRepository;
    productUomRepository;
    productPriceRepository;
    productDiscountRepository;
    uomCatalogService;
    dataSource;
    s3Service;
    constructor(productRepository, productUomRepository, productPriceRepository, productDiscountRepository, uomCatalogService, dataSource, s3Service) {
        this.productRepository = productRepository;
        this.productUomRepository = productUomRepository;
        this.productPriceRepository = productPriceRepository;
        this.productDiscountRepository = productDiscountRepository;
        this.uomCatalogService = uomCatalogService;
        this.dataSource = dataSource;
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
            ...(dto.item_kind !== undefined ? { item_kind: dto.item_kind } : {}),
            ...(satClave !== undefined ? { sat_clave: satClave } : {}),
        };
    }
    async create(dto, tenantId) {
        const itemKind = dto.item_kind ?? product_item_kind_enum_1.ProductItemKind.Goods;
        let sku = dto.sku?.trim() || '';
        if (!sku) {
            if (itemKind !== product_item_kind_enum_1.ProductItemKind.Service) {
                throw new common_1.BadRequestException('El SKU es obligatorio');
            }
            sku = await this.generateServiceSku(tenantId);
        }
        const existing = await this.productRepository.findOne({
            where: { tenant_id: tenantId, sku },
        });
        if (existing) {
            throw new common_1.ConflictException(`Ya existe un producto con SKU "${sku}"`);
        }
        if (dto.external_sku) {
            const existingExternalSku = await this.productRepository.findOne({
                where: { tenant_id: tenantId, external_sku: dto.external_sku },
            });
            if (existingExternalSku) {
                throw new common_1.ConflictException(`Ya existe un producto con SKU externo "${dto.external_sku}"`);
            }
        }
        const baseUomCatalogId = dto.base_uom_catalog_id || dto.base_uom_id;
        if (baseUomCatalogId) {
            await this.uomCatalogService.findOne(baseUomCatalogId, tenantId);
        }
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const product = qr.manager.create(product_entity_1.Product, {
                ...this.extractAllowedProductFields({ ...dto, sku, item_kind: itemKind }),
                tenant_id: tenantId,
                is_active: true,
                item_kind: itemKind,
                sku,
            });
            const saved = await qr.manager.save(product_entity_1.Product, product);
            let createdUom = null;
            if (baseUomCatalogId) {
                createdUom = qr.manager.create(product_uom_entity_1.ProductUoM, {
                    product_id: saved.id,
                    uom_catalog_id: baseUomCatalogId,
                    factor: 1,
                    is_base: true,
                    parent_uom_id: null,
                });
                createdUom = await qr.manager.save(product_uom_entity_1.ProductUoM, createdUom);
            }
            await qr.commitTransaction();
            const response = await this.toResponseWithPhotoUrl(saved);
            if (!createdUom) {
                return response;
            }
            return {
                ...response,
                product_uom_id: createdUom.id,
                base_product_uom_id: createdUom.id,
            };
        }
        catch (error) {
            await qr.rollbackTransaction();
            throw error;
        }
        finally {
            await qr.release();
        }
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
        const { search, sku, external_sku, name, category_id, subcategory_id, is_active, item_kind } = query;
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
        if (item_kind) {
            queryBuilder.andWhere('product.item_kind = :itemKind', { itemKind: item_kind });
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
                throw new common_1.ConflictException(`Ya existe un producto con SKU "${dto.sku}"`);
            }
        }
        if (dto.external_sku && dto.external_sku !== product.external_sku) {
            const existingExternalSku = await this.productRepository.findOne({
                where: { tenant_id: tenantId, external_sku: dto.external_sku },
            });
            if (existingExternalSku) {
                throw new common_1.ConflictException(`Ya existe un producto con SKU externo "${dto.external_sku}"`);
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
    async findServiceCatalogSummary(tenantId, query) {
        let page = Number(query.page) || 1;
        let limit = Number(query.limit) || 40;
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 1;
        if (limit > 100)
            limit = 100;
        const skip = (page - 1) * limit;
        const qb = this.productRepository
            .createQueryBuilder('product')
            .where('product.tenant_id = :tenantId', { tenantId })
            .andWhere('product.is_active = :isActive', { isActive: true })
            .andWhere('product.item_kind = :itemKind', { itemKind: product_item_kind_enum_1.ProductItemKind.Service });
        (0, product_search_rank_util_1.applyProductSearchFilter)(qb, query.search);
        const ranked = (0, product_search_rank_util_1.applyProductSearchOrder)(qb, query.search, false);
        if (!ranked) {
            qb.orderBy('product.name', 'ASC');
        }
        const [products, total] = await qb.skip(skip).take(limit).getManyAndCount();
        const productIds = products.map((product) => product.id);
        const [baseUoms, prices, discounts] = await Promise.all([
            this.loadBaseUoms(productIds),
            this.loadActivePrices(productIds),
            this.loadActiveDiscounts(productIds),
        ]);
        const data = products.map((product) => {
            const baseUom = baseUoms.get(product.id);
            const productUomId = baseUom?.id ?? '';
            const uomCatalogId = baseUom?.uom_catalog_id ?? '';
            const pricingOptions = prices.get(product.id) ?? [];
            const suggested = pricingOptions[0] ?? null;
            const applicableDiscounts = (discounts.get(product.id) ?? [])
                .filter((discount) => productUomId && (0, product_discount_util_1.isProductDiscountApplicable)(discount, productUomId))
                .map(product_discount_util_1.mapApplicableProductDiscount);
            return {
                product_id: product.id,
                product_name: product.name,
                product_sku: product.sku,
                product_description: product.description ?? null,
                sat_clave: product.sat_clave ?? null,
                product_photo: product.photo,
                item_kind: product_item_kind_enum_1.ProductItemKind.Service,
                uom_id: uomCatalogId,
                uom_name: baseUom?.uom?.name ?? '',
                warehouse_ids: [],
                warehouse_names: [],
                suggested_unit_price: suggested?.price ?? null,
                suggested_iva_percentage: suggested?.iva_percentage ?? null,
                suggested_ieps_percentage: suggested?.ieps_percentage ?? null,
                pricing_options: pricingOptions,
                product_uom_id: productUomId,
                has_applicable_discounts: applicableDiscounts.length > 0,
                applicable_discounts: applicableDiscounts,
                total_available_quantity: null,
                total_initial_quantity: null,
                total_batches: 0,
                measure_totals: [],
                batches: [],
            };
        });
        return {
            billing_branch_id: query.billing_branch_id ?? null,
            fiscal_configuration_id: query.fiscal_configuration_id ?? null,
            warehouses: [],
            applied_warehouse_id: null,
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 0,
        };
    }
    async generateServiceSku(tenantId) {
        for (let attempt = 0; attempt < 8; attempt += 1) {
            const sku = `SRV-${Date.now().toString(36).toUpperCase()}${attempt}`;
            const existing = await this.productRepository.findOne({
                where: { tenant_id: tenantId, sku },
            });
            if (!existing) {
                return sku;
            }
        }
        return `SRV-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }
    async loadBaseUoms(productIds) {
        const map = new Map();
        if (productIds.length === 0) {
            return map;
        }
        const uoms = await this.productUomRepository
            .createQueryBuilder('pu')
            .leftJoinAndSelect('pu.uom', 'uom')
            .where('pu.product_id IN (:...productIds)', { productIds })
            .andWhere('pu.is_base = :isBase', { isBase: true })
            .getMany();
        for (const row of uoms) {
            map.set(row.product_id, row);
        }
        return map;
    }
    async loadActivePrices(productIds) {
        const map = new Map();
        if (productIds.length === 0) {
            return map;
        }
        const prices = await this.productPriceRepository
            .createQueryBuilder('pp')
            .leftJoinAndSelect('pp.price_list', 'price_list')
            .where('pp.product_id IN (:...productIds)', { productIds })
            .andWhere('price_list.is_active = :isActive', { isActive: true })
            .orderBy('price_list.created_at', 'ASC')
            .addOrderBy('pp.created_at', 'ASC')
            .getMany();
        for (const price of prices) {
            const options = map.get(price.product_id) || [];
            options.push({
                price_list_id: price.price_list_id,
                price_list_name: price.price_list?.name ?? 'N/A',
                price: Number(price.price ?? 0).toFixed(2),
                iva_percentage: Number(price.iva_percentage ?? 0).toFixed(2),
                ieps_percentage: Number(price.ieps_percentage ?? 0).toFixed(2),
                total: Number(price.total ?? 0).toFixed(2),
            });
            map.set(price.product_id, options);
        }
        return map;
    }
    async loadActiveDiscounts(productIds) {
        const map = new Map();
        if (productIds.length === 0) {
            return map;
        }
        const discounts = await this.productDiscountRepository
            .createQueryBuilder('discount')
            .where('discount.product_id IN (:...productIds)', { productIds })
            .andWhere('discount.is_active = :isActive', { isActive: true })
            .orderBy('discount.created_at', 'ASC')
            .getMany();
        for (const discount of discounts) {
            const current = map.get(discount.product_id) ?? [];
            current.push(discount);
            map.set(discount.product_id, current);
        }
        return map;
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
    __param(1, (0, typeorm_1.InjectRepository)(product_uom_entity_1.ProductUoM)),
    __param(2, (0, typeorm_1.InjectRepository)(product_price_entity_1.ProductPrice)),
    __param(3, (0, typeorm_1.InjectRepository)(product_discount_entity_1.ProductDiscount)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        uom_catalog_service_1.UoMCatalogService,
        typeorm_2.DataSource,
        s3_service_1.S3Service])
], ProductService);
//# sourceMappingURL=product.service.js.map