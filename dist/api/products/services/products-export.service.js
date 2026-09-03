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
exports.ProductsExportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../../../entities/products/product.entity");
const product_uom_entity_1 = require("../../../entities/products/product-uom.entity");
const price_list_entity_1 = require("../../../entities/products/price-list.entity");
const product_price_entity_1 = require("../../../entities/products/product-price.entity");
const product_vendor_cost_entity_1 = require("../../../entities/products/product-vendor-cost.entity");
const excel_export_util_1 = require("../../../common/utils/excel-export.util");
let ProductsExportService = class ProductsExportService {
    productRepo;
    productUomRepo;
    priceListRepo;
    productPriceRepo;
    vendorCostRepo;
    constructor(productRepo, productUomRepo, priceListRepo, productPriceRepo, vendorCostRepo) {
        this.productRepo = productRepo;
        this.productUomRepo = productUomRepo;
        this.priceListRepo = priceListRepo;
        this.productPriceRepo = productPriceRepo;
        this.vendorCostRepo = vendorCostRepo;
    }
    getFilename() {
        const date = new Date().toISOString().slice(0, 10);
        return `catalogo-productos-${date}.xlsx`;
    }
    async exportCatalog(orgId, filters) {
        const products = await this.fetchProducts(orgId, filters);
        const productIds = products.map((p) => p.id);
        const priceLists = await this.priceListRepo.find({
            where: { tenant_id: orgId },
            order: { is_active: 'DESC', name: 'ASC' },
        });
        const uoms = productIds.length
            ? await this.productUomRepo.find({
                where: { product_id: (0, typeorm_2.In)(productIds) },
                relations: ['uom'],
            })
            : [];
        const uomsByProduct = new Map();
        for (const uom of uoms) {
            const list = uomsByProduct.get(uom.product_id) ?? [];
            list.push(uom);
            uomsByProduct.set(uom.product_id, list);
        }
        const uomIds = uoms.map((u) => u.id);
        const costs = uomIds.length
            ? await this.vendorCostRepo.find({ where: { product_uom_id: (0, typeorm_2.In)(uomIds) } })
            : [];
        const prices = uomIds.length
            ? await this.productPriceRepo.find({ where: { product_uom_id: (0, typeorm_2.In)(uomIds) } })
            : [];
        const costsByUom = this.groupNumbers(costs.map((c) => ({ key: c.product_uom_id, value: Number(c.cost) })));
        const pricesByUom = this.groupNumbers(prices.map((p) => ({ key: p.product_uom_id, value: Number(p.price) })));
        const priceByUomAndList = new Map();
        for (const price of prices) {
            priceByUomAndList.set(`${price.product_uom_id}:${price.price_list_id}`, Number(price.price));
        }
        const columns = this.buildColumns(priceLists);
        const rows = [];
        for (const product of products) {
            const productUoms = uomsByProduct.get(product.id) ?? [];
            if (productUoms.length === 0) {
                rows.push(this.buildRow(product, null, null, null, priceLists, priceByUomAndList));
                continue;
            }
            const sorted = [...productUoms].sort((a, b) => {
                if (a.is_base !== b.is_base)
                    return a.is_base ? -1 : 1;
                return (a.uom?.name ?? '').localeCompare(b.uom?.name ?? '', 'es');
            });
            for (const uom of sorted) {
                rows.push(this.buildRow(product, uom, this.average(costsByUom.get(uom.id)), this.average(pricesByUom.get(uom.id)), priceLists, priceByUomAndList));
            }
        }
        return (0, excel_export_util_1.buildStyledExcelBuffer)({
            sheetName: 'Catálogo',
            title: 'Catálogo de productos',
            subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                `Generado: ${(0, excel_export_util_1.formatExportDateTime)(new Date())}`,
                `Registros: ${rows.length}`,
                this.describeFilters(filters),
            ]),
            columns,
            rows,
            headerColor: 'FF5B4B8A',
            titleColor: 'FF3D3166',
        });
    }
    buildColumns(priceLists) {
        const columns = [
            { header: 'Nombre', key: 'name', width: 32 },
            { header: 'SKU', key: 'sku', width: 16 },
            { header: 'SKU externo', key: 'external_sku', width: 16 },
            { header: 'Categoría', key: 'category', width: 20 },
            { header: 'Subcategoría', key: 'subcategory', width: 20 },
            { header: 'UOM', key: 'uom', width: 14 },
            { header: 'UOM base', key: 'uom_base', width: 12 },
            { header: 'Activo', key: 'is_active', width: 10 },
            { header: 'Costo promedio', key: 'avg_cost', width: 16, type: 'currency' },
            { header: 'Precio promedio', key: 'avg_price', width: 16, type: 'currency' },
        ];
        for (const list of priceLists) {
            columns.push({
                header: `Precio: ${list.name}`,
                key: this.priceListKey(list.id),
                width: Math.min(28, Math.max(16, list.name.length + 10)),
                type: 'currency',
            });
        }
        return columns;
    }
    buildRow(product, uom, avgCost, avgPrice, priceLists, priceByUomAndList) {
        const row = {
            name: product.name ?? '',
            sku: product.sku ?? '',
            external_sku: product.external_sku ?? '',
            category: product.category?.name ?? '',
            subcategory: product.subcategory?.name ?? '',
            uom: uom?.uom?.name ?? '',
            uom_base: uom ? (uom.is_base ? 'Sí' : 'No') : '',
            is_active: product.is_active ? 'Sí' : 'No',
            avg_cost: avgCost,
            avg_price: avgPrice,
        };
        for (const list of priceLists) {
            const key = this.priceListKey(list.id);
            row[key] = uom
                ? (priceByUomAndList.get(`${uom.id}:${list.id}`) ?? null)
                : null;
        }
        return row;
    }
    async fetchProducts(orgId, query) {
        const { search, sku, external_sku, name, category_id, subcategory_id, is_active } = query;
        const queryBuilder = this.productRepo
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.subcategory', 'subcategory')
            .where('product.tenant_id = :orgId', { orgId });
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
        return queryBuilder.orderBy('product.name', 'ASC').getMany();
    }
    groupNumbers(items) {
        const map = new Map();
        for (const item of items) {
            if (!Number.isFinite(item.value))
                continue;
            const list = map.get(item.key) ?? [];
            list.push(item.value);
            map.set(item.key, list);
        }
        return map;
    }
    average(values) {
        if (!values?.length)
            return null;
        const sum = values.reduce((acc, n) => acc + n, 0);
        return Math.round((sum / values.length) * 100) / 100;
    }
    priceListKey(id) {
        return `price_list_${id}`;
    }
    describeFilters(filters) {
        const parts = [];
        if (filters.search)
            parts.push(`Búsqueda: ${filters.search}`);
        if (filters.sku)
            parts.push(`SKU: ${filters.sku}`);
        if (filters.external_sku)
            parts.push(`SKU externo: ${filters.external_sku}`);
        if (filters.name)
            parts.push(`Nombre: ${filters.name}`);
        if (filters.category_id)
            parts.push('Categoría filtrada');
        if (filters.subcategory_id)
            parts.push('Subcategoría filtrada');
        if (filters.is_active === true)
            parts.push('Solo activos');
        if (filters.is_active === false)
            parts.push('Solo inactivos');
        return parts.join(' | ');
    }
};
exports.ProductsExportService = ProductsExportService;
exports.ProductsExportService = ProductsExportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(product_uom_entity_1.ProductUoM)),
    __param(2, (0, typeorm_1.InjectRepository)(price_list_entity_1.PriceList)),
    __param(3, (0, typeorm_1.InjectRepository)(product_price_entity_1.ProductPrice)),
    __param(4, (0, typeorm_1.InjectRepository)(product_vendor_cost_entity_1.ProductVendorCost)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ProductsExportService);
//# sourceMappingURL=products-export.service.js.map