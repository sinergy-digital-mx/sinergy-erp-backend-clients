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
exports.ProductVendorImportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_vendor_cost_entity_1 = require("../../../entities/products/product-vendor-cost.entity");
const product_price_entity_1 = require("../../../entities/products/product-price.entity");
const price_list_entity_1 = require("../../../entities/products/price-list.entity");
const vendor_entity_1 = require("../../../entities/vendor/vendor.entity");
const product_vendor_import_excel_util_1 = require("../utils/product-vendor-import-excel.util");
const excel_export_util_1 = require("../../../common/utils/excel-export.util");
const unit_amount_util_1 = require("../../../common/utils/unit-amount.util");
let ProductVendorImportService = class ProductVendorImportService {
    vendorCostRepo;
    productPriceRepo;
    priceListRepo;
    vendorRepo;
    constructor(vendorCostRepo, productPriceRepo, priceListRepo, vendorRepo) {
        this.vendorCostRepo = vendorCostRepo;
        this.productPriceRepo = productPriceRepo;
        this.priceListRepo = priceListRepo;
        this.vendorRepo = vendorRepo;
    }
    async previewCosts(orgId, vendorId) {
        const vendor = await this.requireVendor(orgId, vendorId);
        const costs = await this.loadVendorCosts(orgId, vendorId);
        return {
            vendor_id: vendor.id,
            vendor_name: vendor.name,
            product_count: new Set(costs.map((c) => c.product_id)).size,
            row_count: costs.length,
        };
    }
    async previewPrices(orgId, vendorId, priceListId) {
        const vendor = await this.requireVendor(orgId, vendorId);
        const priceList = await this.requirePriceList(orgId, priceListId);
        const costs = await this.loadVendorCosts(orgId, vendorId);
        return {
            vendor_id: vendor.id,
            vendor_name: vendor.name,
            price_list_id: priceList.id,
            price_list_name: priceList.name,
            product_count: new Set(costs.map((c) => c.product_id)).size,
            row_count: costs.length,
        };
    }
    async exportCostTemplate(orgId, vendorId) {
        const vendor = await this.requireVendor(orgId, vendorId);
        const costs = await this.loadVendorCosts(orgId, vendorId);
        if (!costs.length) {
            throw new common_1.BadRequestException('Este proveedor no tiene productos con costo. Agrégalos en el catálogo primero.');
        }
        const rows = costs.map((cost) => ({
            sku: cost.product?.sku ?? '',
            name: cost.product?.name ?? '',
            uom: cost.product_uom?.uom?.name ?? '',
            currency: cost.currency ?? 'MXN',
            is_active: cost.product?.is_active ? 'Sí' : 'No',
            current_value: this.toNumber(cost.cost),
            new_value: null,
            _id: cost.id,
            _product_id: cost.product_id,
            _product_uom_id: cost.product_uom_id,
        }));
        const buffer = await (0, product_vendor_import_excel_util_1.buildVendorImportTemplate)({
            kind: 'cost',
            title: `Costos — ${vendor.name}`,
            subtitle: [
                `Generado: ${(0, excel_export_util_1.formatExportDateTime)(new Date())}`,
                `${rows.length} renglones`,
                'Llena solo Nuevo costo. Vacío = no cambia.',
                'No afecta OC / OV ya creadas.',
            ].join('  •  '),
            contextLines: [
                `Proveedor: ${vendor.name}`,
                `Renglones: ${rows.length} (un renglón por producto + UOM)`,
            ],
            rows,
        });
        return { buffer, filename: (0, product_vendor_import_excel_util_1.vendorImportFilename)('cost', vendor.name) };
    }
    async exportPriceTemplate(orgId, vendorId, priceListId) {
        const vendor = await this.requireVendor(orgId, vendorId);
        const priceList = await this.requirePriceList(orgId, priceListId);
        const costs = await this.loadVendorCosts(orgId, vendorId);
        if (!costs.length) {
            throw new common_1.BadRequestException('Este proveedor no tiene productos con costo. Agrégalos en el catálogo primero.');
        }
        const prices = await this.productPriceRepo.find({
            where: {
                product_uom_id: (0, typeorm_2.In)(costs.map((c) => c.product_uom_id)),
                price_list_id: priceListId,
            },
        });
        const priceByUom = new Map(prices.map((p) => [p.product_uom_id, p]));
        const rows = costs.map((cost) => {
            const price = priceByUom.get(cost.product_uom_id);
            return {
                sku: cost.product?.sku ?? '',
                name: cost.product?.name ?? '',
                uom: cost.product_uom?.uom?.name ?? '',
                price_list: priceList.name,
                is_active: cost.product?.is_active ? 'Sí' : 'No',
                current_value: price ? this.toNumber(price.price) : null,
                new_value: null,
                _id: price?.id ?? '',
                _product_id: cost.product_id,
                _product_uom_id: cost.product_uom_id,
                _price_list_id: priceList.id,
            };
        });
        const buffer = await (0, product_vendor_import_excel_util_1.buildVendorImportTemplate)({
            kind: 'price',
            title: `Precios — ${vendor.name}`,
            subtitle: [
                `Lista: ${priceList.name}`,
                `Generado: ${(0, excel_export_util_1.formatExportDateTime)(new Date())}`,
                `${rows.length} renglones`,
                'Llena solo Nuevo precio. Vacío = no cambia.',
                'No afecta OV ya creadas.',
            ].join('  •  '),
            contextLines: [
                `Proveedor: ${vendor.name}`,
                `Lista de precios: ${priceList.name}`,
                `Renglones: ${rows.length} (productos de este proveedor en esta lista)`,
            ],
            rows,
        });
        return {
            buffer,
            filename: (0, product_vendor_import_excel_util_1.vendorImportFilename)('price', vendor.name, priceList.name),
        };
    }
    async importCosts(orgId, vendorId, file) {
        this.assertExcelFile(file);
        await this.requireVendor(orgId, vendorId);
        const costs = await this.loadVendorCosts(orgId, vendorId);
        const parsed = this.parseFile(file.buffer, 'cost');
        const byId = new Map(costs.map((c) => [c.id, c]));
        const bySkuUom = new Map(costs.map((c) => [this.skuUomKey(c.product?.sku ?? '', c.product_uom?.uom?.name ?? ''), c]));
        const result = this.emptyResult();
        for (const row of parsed) {
            if (row.new_value === null) {
                result.skipped += 1;
                continue;
            }
            const amountError = this.validateAmount(row.new_value, 'costo');
            if (amountError) {
                result.errors.push({ row: row.row_number, sku: row.sku, message: amountError });
                continue;
            }
            const match = this.matchCost(row, byId, bySkuUom);
            if (!match) {
                result.errors.push({
                    row: row.row_number,
                    sku: row.sku,
                    message: 'El SKU no pertenece a este proveedor o la UOM no coincide.',
                });
                continue;
            }
            const nextCost = this.roundUnitCost(row.new_value);
            if (nextCost === this.roundUnitCost(this.toNumber(match.cost))) {
                result.skipped += 1;
                continue;
            }
            const totals = this.calculateTotals(nextCost, this.toNumber(match.iva_percentage), this.toNumber(match.ieps_percentage));
            match.cost = nextCost;
            Object.assign(match, totals);
            await this.vendorCostRepo.save(match);
            result.updated += 1;
        }
        return result;
    }
    async importPrices(orgId, vendorId, priceListId, file) {
        this.assertExcelFile(file);
        await this.requireVendor(orgId, vendorId);
        await this.requirePriceList(orgId, priceListId);
        const costs = await this.loadVendorCosts(orgId, vendorId);
        const parsed = this.parseFile(file.buffer, 'price');
        const prices = costs.length
            ? await this.productPriceRepo.find({
                where: {
                    product_uom_id: (0, typeorm_2.In)(costs.map((c) => c.product_uom_id)),
                    price_list_id: priceListId,
                },
            })
            : [];
        const priceById = new Map(prices.map((p) => [p.id, p]));
        const priceByUom = new Map(prices.map((p) => [p.product_uom_id, p]));
        const costBySkuUom = new Map(costs.map((c) => [this.skuUomKey(c.product?.sku ?? '', c.product_uom?.uom?.name ?? ''), c]));
        const costByProductUom = new Map(costs.map((c) => [c.product_uom_id, c]));
        const result = this.emptyResult();
        for (const row of parsed) {
            if (row.new_value === null) {
                result.skipped += 1;
                continue;
            }
            const amountError = this.validateAmount(row.new_value, 'precio');
            if (amountError) {
                result.errors.push({ row: row.row_number, sku: row.sku, message: amountError });
                continue;
            }
            const cost = this.matchCostForPrice(row, costBySkuUom, costByProductUom);
            if (!cost) {
                result.errors.push({
                    row: row.row_number,
                    sku: row.sku,
                    message: 'El SKU no pertenece a este proveedor o la UOM no coincide.',
                });
                continue;
            }
            const nextPrice = this.roundPrice(row.new_value);
            const existing = (row.id ? priceById.get(row.id) : undefined) ?? priceByUom.get(cost.product_uom_id);
            if (existing) {
                if (existing.price_list_id !== priceListId || existing.product_id !== cost.product_id) {
                    result.errors.push({
                        row: row.row_number,
                        sku: row.sku,
                        message: 'El renglón no corresponde a esta lista de precios.',
                    });
                    continue;
                }
                if (nextPrice === this.roundPrice(this.toNumber(existing.price))) {
                    result.skipped += 1;
                    continue;
                }
                const totals = this.calculateTotals(nextPrice, this.toNumber(existing.iva_percentage), this.toNumber(existing.ieps_percentage));
                existing.price = nextPrice;
                Object.assign(existing, totals);
                await this.productPriceRepo.save(existing);
                result.updated += 1;
                continue;
            }
            const totals = this.calculateTotals(nextPrice, this.toNumber(cost.iva_percentage), this.toNumber(cost.ieps_percentage));
            const created = this.productPriceRepo.create({
                product_id: cost.product_id,
                price_list_id: priceListId,
                product_uom_id: cost.product_uom_id,
                price: nextPrice,
                iva_percentage: this.toNumber(cost.iva_percentage),
                ieps_percentage: this.toNumber(cost.ieps_percentage),
                ...totals,
            });
            const saved = await this.productPriceRepo.save(created);
            priceById.set(saved.id, saved);
            priceByUom.set(saved.product_uom_id, saved);
            result.created += 1;
        }
        return result;
    }
    async requireVendor(orgId, vendorId) {
        const vendor = await this.vendorRepo.findOne({
            where: { id: vendorId, tenant_id: orgId },
        });
        if (!vendor) {
            throw new common_1.NotFoundException('Proveedor no encontrado');
        }
        return vendor;
    }
    async requirePriceList(orgId, priceListId) {
        const priceList = await this.priceListRepo.findOne({
            where: { id: priceListId, tenant_id: orgId },
        });
        if (!priceList) {
            throw new common_1.NotFoundException('Lista de precios no encontrada');
        }
        return priceList;
    }
    async loadVendorCosts(orgId, vendorId) {
        const costs = await this.vendorCostRepo
            .createQueryBuilder('cost')
            .innerJoinAndSelect('cost.product', 'product')
            .innerJoinAndSelect('cost.product_uom', 'product_uom')
            .leftJoinAndSelect('product_uom.uom', 'uom')
            .where('cost.vendor_id = :vendorId', { vendorId })
            .andWhere('product.tenant_id = :orgId', { orgId })
            .orderBy('product.name', 'ASC')
            .addOrderBy('product_uom.is_base', 'DESC')
            .addOrderBy('uom.name', 'ASC')
            .getMany();
        return costs;
    }
    parseFile(buffer, kind) {
        try {
            const rows = (0, product_vendor_import_excel_util_1.parseVendorImportExcel)(buffer, kind);
            if (!rows.length) {
                throw new common_1.BadRequestException('El archivo no tiene renglones de productos');
            }
            return rows;
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            const message = error instanceof Error ? error.message : 'No se pudo leer el Excel';
            throw new common_1.BadRequestException(message);
        }
    }
    assertExcelFile(file) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('Adjunta el archivo Excel descargado');
        }
        const name = (file.originalname ?? '').toLowerCase();
        if (!name.endsWith('.xlsx')) {
            throw new common_1.BadRequestException('El archivo debe ser .xlsx (el template descargado)');
        }
    }
    matchCost(row, byId, bySkuUom) {
        if (row.id && byId.has(row.id))
            return byId.get(row.id);
        return bySkuUom.get(this.skuUomKey(row.sku, row.uom));
    }
    matchCostForPrice(row, costBySkuUom, costByProductUom) {
        if (row.product_uom_id && costByProductUom.has(row.product_uom_id)) {
            return costByProductUom.get(row.product_uom_id);
        }
        return costBySkuUom.get(this.skuUomKey(row.sku, row.uom));
    }
    skuUomKey(sku, uom) {
        return `${sku.trim().toLowerCase()}::${uom.trim().toLowerCase()}`;
    }
    validateAmount(value, label) {
        if (!Number.isFinite(value) || value < 0) {
            return `El ${label} debe ser un número mayor o igual a 0`;
        }
        return null;
    }
    roundUnitCost(cost) {
        return (0, unit_amount_util_1.roundUnitAmount)(cost);
    }
    roundPrice(price) {
        return (0, unit_amount_util_1.roundUnitAmount)(price);
    }
    calculateTotals(base, ivaPercentage, iepsPercentage) {
        const iva_unit_total = (base * ivaPercentage) / 100;
        const ieps_unit_total = (base * iepsPercentage) / 100;
        return {
            subtotal: Number(base.toFixed(2)),
            iva_unit_total: Number(iva_unit_total.toFixed(2)),
            ieps_unit_total: Number(ieps_unit_total.toFixed(2)),
            total: Number((base + iva_unit_total + ieps_unit_total).toFixed(2)),
        };
    }
    toNumber(value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    }
    emptyResult() {
        return { updated: 0, created: 0, skipped: 0, errors: [] };
    }
};
exports.ProductVendorImportService = ProductVendorImportService;
exports.ProductVendorImportService = ProductVendorImportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_vendor_cost_entity_1.ProductVendorCost)),
    __param(1, (0, typeorm_1.InjectRepository)(product_price_entity_1.ProductPrice)),
    __param(2, (0, typeorm_1.InjectRepository)(price_list_entity_1.PriceList)),
    __param(3, (0, typeorm_1.InjectRepository)(vendor_entity_1.Vendor)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ProductVendorImportService);
//# sourceMappingURL=product-vendor-import.service.js.map