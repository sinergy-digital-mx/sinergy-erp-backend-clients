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
exports.VendorProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const products_1 = require("../../../entities/products");
let VendorProductsService = class VendorProductsService {
    productRepository;
    productUomRepository;
    productVendorCostRepository;
    constructor(productRepository, productUomRepository, productVendorCostRepository) {
        this.productRepository = productRepository;
        this.productUomRepository = productUomRepository;
        this.productVendorCostRepository = productVendorCostRepository;
    }
    async getVendorProducts(vendorId, tenantId, query = {}) {
        const includeWithoutCost = this.shouldIncludeWithoutCost(query);
        const search = query.search?.trim() || '';
        if (!includeWithoutCost) {
            return this.listProductsWithVendorCost(vendorId, tenantId, search);
        }
        return this.listActiveCatalog(vendorId, tenantId, search);
    }
    shouldIncludeWithoutCost(query) {
        if (query.only_with_cost === true)
            return false;
        return query.include_without_cost !== false;
    }
    async listActiveCatalog(vendorId, tenantId, search) {
        const productsQb = this.productRepository
            .createQueryBuilder('product')
            .where('product.tenant_id = :tenantId', { tenantId })
            .andWhere('product.is_active = :isActive', { isActive: true });
        this.applyProductSearch(productsQb, search);
        productsQb.orderBy('product.name', 'ASC');
        const products = await productsQb.getMany();
        if (products.length === 0)
            return [];
        const productIds = products.map((product) => product.id);
        const [uomsByProduct, costsByProductUom] = await Promise.all([
            this.loadProductUoms(productIds),
            this.loadCostsByProductUom(vendorId, productIds),
        ]);
        return products.map((product) => {
            const productUoms = uomsByProduct.get(product.id) ?? [];
            const uoms = productUoms.map((productUom) => {
                const vendorCost = costsByProductUom.get(productUom.id);
                return vendorCost
                    ? this.mapUomFromCost(vendorCost)
                    : this.mapUomWithoutCost(productUom);
            });
            const hasVendorCost = productUoms.some((uom) => costsByProductUom.has(uom.id));
            return this.toVendorProduct(product, uoms, hasVendorCost);
        });
    }
    async listProductsWithVendorCost(vendorId, tenantId, search) {
        const qb = this.productVendorCostRepository
            .createQueryBuilder('pvc')
            .innerJoinAndSelect('pvc.product', 'product')
            .innerJoinAndSelect('pvc.product_uom', 'product_uom')
            .leftJoinAndSelect('product_uom.uom', 'uom')
            .where('pvc.vendor_id = :vendorId', { vendorId })
            .andWhere('product.tenant_id = :tenantId', { tenantId })
            .andWhere('product.is_active = :isActive', { isActive: true });
        this.applyProductSearch(qb, search);
        qb.orderBy('product.name', 'ASC');
        const vendorCosts = await qb.getMany();
        const byProduct = new Map();
        for (const vendorCost of vendorCosts) {
            const uomEntry = this.mapUomFromCost(vendorCost);
            const existing = byProduct.get(vendorCost.product_id);
            if (existing) {
                existing.uoms.push(uomEntry);
                continue;
            }
            byProduct.set(vendorCost.product_id, this.toVendorProduct(vendorCost.product, [uomEntry], true));
        }
        return Array.from(byProduct.values());
    }
    async loadProductUoms(productIds) {
        const rows = await this.productUomRepository
            .createQueryBuilder('product_uom')
            .leftJoinAndSelect('product_uom.uom', 'uom')
            .where('product_uom.product_id IN (:...productIds)', { productIds })
            .orderBy('product_uom.is_base', 'DESC')
            .addOrderBy('uom.name', 'ASC')
            .getMany();
        const byProduct = new Map();
        for (const row of rows) {
            const list = byProduct.get(row.product_id) ?? [];
            list.push(row);
            byProduct.set(row.product_id, list);
        }
        return byProduct;
    }
    async loadCostsByProductUom(vendorId, productIds) {
        const vendorCosts = await this.productVendorCostRepository
            .createQueryBuilder('pvc')
            .innerJoinAndSelect('pvc.product_uom', 'product_uom')
            .leftJoinAndSelect('product_uom.uom', 'uom')
            .where('pvc.vendor_id = :vendorId', { vendorId })
            .andWhere('pvc.product_id IN (:...productIds)', { productIds })
            .getMany();
        const byProductUom = new Map();
        for (const vendorCost of vendorCosts) {
            byProductUom.set(vendorCost.product_uom_id, vendorCost);
        }
        return byProductUom;
    }
    applyProductSearch(qb, search) {
        if (!search)
            return;
        qb.andWhere(this.productSearchSql(), this.productSearchParams(search));
    }
    productSearchSql() {
        return `(LOWER(product.name) LIKE LOWER(:search)
      OR LOWER(product.sku) LIKE LOWER(:search)
      OR LOWER(product.external_sku) LIKE LOWER(:search))`;
    }
    productSearchParams(search) {
        return search ? { search: `%${search}%` } : {};
    }
    toVendorProduct(product, uoms, hasVendorCost) {
        return {
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            sku: product.sku,
            has_vendor_cost: hasVendorCost,
            uoms,
        };
    }
    mapUomWithoutCost(productUom) {
        return {
            product_uom_id: productUom.id,
            uom_id: productUom.uom_catalog_id,
            uom_name: productUom.uom?.name || 'Unknown',
            factor: Number(productUom.factor) || 1,
            is_base: productUom.is_base || false,
            cost: 0,
            iva_percentage: 0,
            ieps_percentage: 0,
            iva_unit_total: 0,
            ieps_unit_total: 0,
            subtotal: 0,
            currency: null,
        };
    }
    mapUomFromCost(vendorCost) {
        const productUom = vendorCost.product_uom;
        const factor = Number(productUom.factor) || 1;
        const cost = Number(vendorCost.cost);
        const ivaPercentage = Number(vendorCost.iva_percentage) || 0;
        const iepsPercentage = Number(vendorCost.ieps_percentage) || 0;
        const subtotal = cost * factor;
        const ivaAmount = subtotal * (ivaPercentage / 100);
        const iepsAmount = subtotal * (iepsPercentage / 100);
        return {
            product_uom_id: productUom.id,
            uom_id: productUom.uom_catalog_id,
            uom_name: productUom.uom?.name || 'Unknown',
            factor,
            is_base: productUom.is_base || false,
            cost,
            iva_percentage: ivaPercentage,
            ieps_percentage: iepsPercentage,
            iva_unit_total: ivaAmount,
            ieps_unit_total: iepsAmount,
            subtotal,
            currency: vendorCost.currency === 'USD' ? 'USD' : 'MXN',
        };
    }
};
exports.VendorProductsService = VendorProductsService;
exports.VendorProductsService = VendorProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(products_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(products_1.ProductUoM)),
    __param(2, (0, typeorm_1.InjectRepository)(products_1.ProductVendorCost)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], VendorProductsService);
//# sourceMappingURL=vendor-products.service.js.map