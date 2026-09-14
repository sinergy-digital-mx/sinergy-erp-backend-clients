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
var MadereriaInventoryImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MadereriaInventoryImportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const fiscal_configuration_entity_1 = require("../../entities/billing/fiscal-configuration.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const product_entity_1 = require("../../entities/products/product.entity");
const product_uom_entity_1 = require("../../entities/products/product-uom.entity");
const product_price_entity_1 = require("../../entities/products/product-price.entity");
const product_vendor_cost_entity_1 = require("../../entities/products/product-vendor-cost.entity");
const price_list_entity_1 = require("../../entities/products/price-list.entity");
const vendor_entity_1 = require("../../entities/vendor/vendor.entity");
const vendor_type_enum_1 = require("../../entities/vendor/vendor-type.enum");
const uom_catalog_entity_1 = require("../../entities/uom-catalog/uom-catalog.entity");
const inventory_batch_entity_1 = require("../../entities/purchase-orders/inventory-batch.entity");
const batch_number_generator_service_1 = require("../purchase-orders/services/batch-number-generator.service");
const madereria_inventory_import_constants_1 = require("./madereria-inventory-import.constants");
const excel_inventory_parser_1 = require("./excel-inventory.parser");
const import_job_store_1 = require("./import-job.store");
let MadereriaInventoryImportService = MadereriaInventoryImportService_1 = class MadereriaInventoryImportService {
    dataSource;
    fiscalRepository;
    branchRepository;
    warehouseRepository;
    batchNumberGenerator;
    logger = new common_1.Logger(MadereriaInventoryImportService_1.name);
    constructor(dataSource, fiscalRepository, branchRepository, warehouseRepository, batchNumberGenerator) {
        this.dataSource = dataSource;
        this.fiscalRepository = fiscalRepository;
        this.branchRepository = branchRepository;
        this.warehouseRepository = warehouseRepository;
        this.batchNumberGenerator = batchNumberGenerator;
    }
    assertOrganization(organizationId) {
        if (organizationId !== madereria_inventory_import_constants_1.MADERERIA_ORGANIZATION_ID) {
            throw new common_1.ForbiddenException('Este módulo solo está disponible para Madereria Zona Norte');
        }
    }
    async startImportJob(params) {
        this.assertOrganization(params.organizationId);
        this.assertExcelFile(params.file);
        const warehouse = await this.assertWarehouseContext(params.organizationId, params.fiscalConfigurationId, params.billingBranchId, params.warehouseId);
        let rows;
        try {
            rows = (0, excel_inventory_parser_1.parseMadereriaInventoryExcel)(params.file.buffer);
        }
        catch (error) {
            throw new common_1.BadRequestException(error instanceof Error ? error.message : 'No se pudo leer el Excel');
        }
        if (!rows.length) {
            throw new common_1.BadRequestException('El Excel no tiene renglones de inventario');
        }
        const job = (0, import_job_store_1.createImportJob)({
            id: (0, uuid_1.v4)(),
            organizationId: params.organizationId,
            userId: params.userId,
            total: rows.length,
        });
        setImmediate(() => {
            this.runImportJob(job.id, {
                organizationId: params.organizationId,
                userId: params.userId,
                warehouse,
                rows,
            }).catch((err) => {
                this.logger.error(`Import job ${job.id} failed`, err);
                (0, import_job_store_1.updateImportJob)(job.id, {
                    status: 'failed',
                    message: 'Error al importar',
                    error: err instanceof Error ? err.message : 'Error desconocido',
                });
            });
        });
        return job;
    }
    getJobStatus(jobId, organizationId) {
        this.assertOrganization(organizationId);
        const job = (0, import_job_store_1.getImportJob)(jobId, organizationId);
        if (!job) {
            throw new common_1.NotFoundException('Trabajo de importación no encontrado');
        }
        return job;
    }
    async importFile(params) {
        this.assertOrganization(params.organizationId);
        this.assertExcelFile(params.file);
        const warehouse = await this.assertWarehouseContext(params.organizationId, params.fiscalConfigurationId, params.billingBranchId, params.warehouseId);
        let rows;
        try {
            rows = (0, excel_inventory_parser_1.parseMadereriaInventoryExcel)(params.file.buffer);
        }
        catch (error) {
            throw new common_1.BadRequestException(error instanceof Error ? error.message : 'No se pudo leer el Excel');
        }
        return this.executeImport({
            organizationId: params.organizationId,
            userId: params.userId,
            warehouse,
            rows,
        });
    }
    async runImportJob(jobId, params) {
        (0, import_job_store_1.updateImportJob)(jobId, {
            status: 'processing',
            message: `Importando 0 de ${params.rows.length}`,
            processed: 0,
        });
        try {
            const result = await this.executeImport({
                organizationId: params.organizationId,
                userId: params.userId,
                warehouse: params.warehouse,
                rows: params.rows,
                onProgress: (processed, total, sku) => {
                    (0, import_job_store_1.updateImportJob)(jobId, {
                        status: 'processing',
                        processed,
                        total,
                        current_sku: sku,
                        message: `Importando ${processed} de ${total}`,
                    });
                },
            });
            (0, import_job_store_1.updateImportJob)(jobId, {
                status: 'completed',
                processed: result.file_rows,
                current_sku: null,
                message: `Listo: ${result.file_rows} renglones`,
                result,
                error: null,
            });
        }
        catch (error) {
            (0, import_job_store_1.updateImportJob)(jobId, {
                status: 'failed',
                message: 'Error al importar',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
            throw error;
        }
    }
    async executeImport(params) {
        return this.dataSource.transaction(async (manager) => {
            const vendor = await this.ensureImportVendor(manager, params.organizationId);
            const priceList = await this.ensurePriceList(manager, params.organizationId);
            const piezaUomId = await this.ensurePiezaUom(manager, params.organizationId);
            const result = {
                warehouse_id: params.warehouse.id,
                warehouse_name: params.warehouse.name,
                file_rows: params.rows.length,
                products_created: [],
                prices_created: 0,
                costs_created: 0,
                costs_updated: 0,
                batches_created: 0,
                skipped: [],
                errors: [],
            };
            let processed = 0;
            for (const row of params.rows) {
                try {
                    await this.importRow(manager, {
                        organizationId: params.organizationId,
                        userId: params.userId,
                        warehouseId: params.warehouse.id,
                        vendorId: vendor.id,
                        priceListId: priceList.id,
                        piezaUomId,
                        row,
                        result,
                    });
                }
                catch (error) {
                    result.errors.push({
                        sku: row.sku,
                        row_number: row.row_number,
                        message: error instanceof Error ? error.message : 'Error al importar renglón',
                    });
                }
                processed += 1;
                params.onProgress?.(processed, params.rows.length, row.sku);
            }
            return result;
        });
    }
    assertExcelFile(file) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('Adjunta el archivo Excel de inventario');
        }
        const name = (file.originalname || '').toLowerCase();
        if (!name.endsWith('.xls') && !name.endsWith('.xlsx')) {
            throw new common_1.BadRequestException('Solo se aceptan archivos .xls o .xlsx');
        }
    }
    async assertWarehouseContext(organizationId, fiscalId, branchId, warehouseId) {
        const fiscal = await this.fiscalRepository.findOne({
            where: { id: fiscalId, tenant_id: organizationId },
        });
        if (!fiscal) {
            throw new common_1.NotFoundException('Razón social no encontrada');
        }
        const branch = await this.branchRepository.findOne({
            where: { id: branchId, fiscal_configuration_id: fiscalId },
        });
        if (!branch) {
            throw new common_1.NotFoundException('La sucursal no pertenece a esa razón social');
        }
        const warehouse = await this.warehouseRepository.findOne({
            where: { id: warehouseId, tenant_id: organizationId },
        });
        if (!warehouse || warehouse.billing_branch_id !== branchId) {
            throw new common_1.NotFoundException('El almacén no pertenece a esa sucursal');
        }
        return warehouse;
    }
    async importRow(manager, ctx) {
        const { row, result } = ctx;
        let created = false;
        let product = await this.findProduct(manager, ctx.organizationId, row);
        if (!product) {
            product = await this.createProduct(manager, ctx.organizationId, row, ctx.piezaUomId);
            created = true;
            result.products_created.push({
                sku: product.sku,
                name: product.name,
                row_number: row.row_number,
            });
        }
        const productUom = await this.ensureBaseUom(manager, product.id, ctx.piezaUomId);
        if (row.price != null && row.price > 0) {
            const createdPrice = await this.ensurePriceIfMissing(manager, product.id, ctx.priceListId, productUom.id, row.price);
            if (createdPrice) {
                result.prices_created += 1;
            }
        }
        if (row.cost != null && row.cost > 0) {
            const costAction = await this.upsertImportCost(manager, product.id, ctx.vendorId, productUom.id, row.cost);
            if (costAction === 'created') {
                result.costs_created += 1;
            }
            else {
                result.costs_updated += 1;
            }
        }
        if (row.quantity == null || row.quantity <= 0) {
            result.skipped.push({
                sku: row.sku,
                row_number: row.row_number,
                reason: created
                    ? 'Producto creado; cantidad 0, sin lote'
                    : 'Cantidad 0 o vacía, sin lote',
            });
            return;
        }
        const batchNumber = await this.batchNumberGenerator.generateBatchNumber(ctx.warehouseId, ctx.organizationId, manager);
        const batchRepo = manager.getRepository(inventory_batch_entity_1.InventoryBatch);
        await batchRepo.save(batchRepo.create({
            tenant_id: ctx.organizationId,
            batch_number: batchNumber,
            source_tag_identifier: 'IMPORTACION',
            warehouse_id: ctx.warehouseId,
            product_id: product.id,
            uom_id: productUom.uom_catalog_id,
            initial_quantity: row.quantity,
            available_quantity: row.quantity,
            created_by: ctx.userId,
        }));
        result.batches_created += 1;
    }
    async findProduct(manager, organizationId, row) {
        const repo = manager.getRepository(product_entity_1.Product);
        const found = await repo
            .createQueryBuilder('product')
            .where('product.tenant_id = :organizationId', { organizationId })
            .andWhere(new typeorm_2.Brackets((qb) => {
            qb.where('LOWER(product.sku) = LOWER(:sku)', { sku: row.sku }).orWhere('LOWER(product.external_sku) = LOWER(:sku)', { sku: row.sku });
        }))
            .getOne();
        if (found || !row.alternate_sku) {
            return found;
        }
        return repo
            .createQueryBuilder('product')
            .where('product.tenant_id = :organizationId', { organizationId })
            .andWhere(new typeorm_2.Brackets((qb) => {
            qb.where('LOWER(product.sku) = LOWER(:alt)', {
                alt: row.alternate_sku,
            }).orWhere('LOWER(product.external_sku) = LOWER(:alt)', {
                alt: row.alternate_sku,
            });
        }))
            .getOne();
    }
    async createProduct(manager, organizationId, row, piezaUomId) {
        const productRepo = manager.getRepository(product_entity_1.Product);
        const product = await productRepo.save(productRepo.create({
            tenant_id: organizationId,
            sku: row.sku.slice(0, 255),
            external_sku: null,
            name: row.name.slice(0, 255),
            description: row.name,
            is_active: true,
        }));
        const uomRepo = manager.getRepository(product_uom_entity_1.ProductUoM);
        await uomRepo.save(uomRepo.create({
            product_id: product.id,
            uom_catalog_id: piezaUomId,
            factor: 1,
            is_base: true,
            parent_uom_id: null,
        }));
        return product;
    }
    async ensureBaseUom(manager, productId, piezaUomId) {
        const repo = manager.getRepository(product_uom_entity_1.ProductUoM);
        const existing = await repo.findOne({
            where: { product_id: productId, is_base: true },
        });
        if (existing) {
            return existing;
        }
        return repo.save(repo.create({
            product_id: productId,
            uom_catalog_id: piezaUomId,
            factor: 1,
            is_base: true,
            parent_uom_id: null,
        }));
    }
    async ensurePriceIfMissing(manager, productId, priceListId, productUomId, price) {
        const repo = manager.getRepository(product_price_entity_1.ProductPrice);
        const existing = await repo.findOne({
            where: { product_id: productId, price_list_id: priceListId, product_uom_id: productUomId },
        });
        if (existing) {
            return false;
        }
        const totals = this.calculateTotals(price);
        await repo.save(repo.create({
            product_id: productId,
            price_list_id: priceListId,
            product_uom_id: productUomId,
            price,
            iva_percentage: madereria_inventory_import_constants_1.DEFAULT_IVA_PERCENTAGE,
            ieps_percentage: madereria_inventory_import_constants_1.DEFAULT_IEPS_PERCENTAGE,
            ...totals,
        }));
        return true;
    }
    async upsertImportCost(manager, productId, vendorId, productUomId, cost) {
        const repo = manager.getRepository(product_vendor_cost_entity_1.ProductVendorCost);
        const existing = await repo.findOne({
            where: { product_id: productId, vendor_id: vendorId, product_uom_id: productUomId },
        });
        const totals = this.calculateTotals(cost);
        if (existing) {
            Object.assign(existing, {
                cost,
                iva_percentage: madereria_inventory_import_constants_1.DEFAULT_IVA_PERCENTAGE,
                ieps_percentage: madereria_inventory_import_constants_1.DEFAULT_IEPS_PERCENTAGE,
                ...totals,
            });
            await repo.save(existing);
            return 'updated';
        }
        await repo.save(repo.create({
            product_id: productId,
            vendor_id: vendorId,
            product_uom_id: productUomId,
            cost,
            iva_percentage: madereria_inventory_import_constants_1.DEFAULT_IVA_PERCENTAGE,
            ieps_percentage: madereria_inventory_import_constants_1.DEFAULT_IEPS_PERCENTAGE,
            ...totals,
        }));
        return 'created';
    }
    async ensureImportVendor(manager, organizationId) {
        const repo = manager.getRepository(vendor_entity_1.Vendor);
        const existing = await repo
            .createQueryBuilder('vendor')
            .where('vendor.tenant_id = :organizationId', { organizationId })
            .andWhere('UPPER(vendor.name) = :name', { name: madereria_inventory_import_constants_1.IMPORT_VENDOR_NAME })
            .getOne();
        if (existing) {
            return existing;
        }
        return repo.save(repo.create({
            tenant_id: organizationId,
            name: madereria_inventory_import_constants_1.IMPORT_VENDOR_NAME,
            company_name: madereria_inventory_import_constants_1.IMPORT_VENDOR_NAME,
            vendor_type: vendor_type_enum_1.VendorType.NATIONAL,
            status: 'active',
            street: '',
            city: '',
            state: '',
            zip_code: '',
            country: 'México',
            razon_social: madereria_inventory_import_constants_1.IMPORT_VENDOR_NAME,
            rfc: '',
            legal_name: madereria_inventory_import_constants_1.IMPORT_VENDOR_NAME,
            tax_id: '',
        }));
    }
    async ensurePriceList(manager, organizationId) {
        const repo = manager.getRepository(price_list_entity_1.PriceList);
        const existing = await repo.findOne({
            where: { tenant_id: organizationId, is_active: true },
            order: { created_at: 'ASC' },
        });
        if (existing) {
            return existing;
        }
        return repo.save(repo.create({
            tenant_id: organizationId,
            name: 'General',
            description: 'Lista creada por importación de inventario',
            is_active: true,
        }));
    }
    async ensurePiezaUom(manager, organizationId) {
        const repo = manager.getRepository(uom_catalog_entity_1.UoMCatalog);
        const existing = await repo
            .createQueryBuilder('uom')
            .where('uom.tenant_id = :organizationId', { organizationId })
            .andWhere('UPPER(uom.name) IN (:...names)', {
            names: ['PIEZA', 'PZA', 'PZ'],
        })
            .getOne();
        if (existing) {
            return existing.id;
        }
        const created = await repo.save(repo.create({
            tenant_id: organizationId,
            name: madereria_inventory_import_constants_1.DEFAULT_UOM_NAME,
            description: 'UoM por defecto para importación',
        }));
        return created.id;
    }
    calculateTotals(amount) {
        const subtotal = amount;
        const iva_unit_total = (amount * madereria_inventory_import_constants_1.DEFAULT_IVA_PERCENTAGE) / 100;
        const ieps_unit_total = (amount * madereria_inventory_import_constants_1.DEFAULT_IEPS_PERCENTAGE) / 100;
        return {
            subtotal: Number(subtotal.toFixed(2)),
            iva_unit_total: Number(iva_unit_total.toFixed(2)),
            ieps_unit_total: Number(ieps_unit_total.toFixed(2)),
            total: Number((subtotal + iva_unit_total + ieps_unit_total).toFixed(2)),
        };
    }
};
exports.MadereriaInventoryImportService = MadereriaInventoryImportService;
exports.MadereriaInventoryImportService = MadereriaInventoryImportService = MadereriaInventoryImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(fiscal_configuration_entity_1.FiscalConfiguration)),
    __param(2, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(3, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        batch_number_generator_service_1.BatchNumberGeneratorService])
], MadereriaInventoryImportService);
//# sourceMappingURL=madereria-inventory-import.service.js.map