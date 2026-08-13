import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, Brackets } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { Product } from '../../entities/products/product.entity';
import { ProductUoM } from '../../entities/products/product-uom.entity';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { ProductVendorCost } from '../../entities/products/product-vendor-cost.entity';
import { PriceList } from '../../entities/products/price-list.entity';
import { Vendor } from '../../entities/vendor/vendor.entity';
import { VendorType } from '../../entities/vendor/vendor-type.enum';
import { UoMCatalog } from '../../entities/uom-catalog/uom-catalog.entity';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { BatchNumberGeneratorService } from '../purchase-orders/services/batch-number-generator.service';
import {
  DEFAULT_IEPS_PERCENTAGE,
  DEFAULT_IVA_PERCENTAGE,
  DEFAULT_UOM_NAME,
  IMPORT_VENDOR_NAME,
  MADERERIA_ORGANIZATION_ID,
} from './madereria-inventory-import.constants';
import {
  InventoryExcelRow,
  parseMadereriaInventoryExcel,
} from './excel-inventory.parser';
import {
  createImportJob,
  getImportJob,
  ImportInventoryJob,
  ImportInventoryJobResult,
  updateImportJob,
} from './import-job.store';

export type ImportInventoryResult = ImportInventoryJobResult;

@Injectable()
export class MadereriaInventoryImportService {
  private readonly logger = new Logger(MadereriaInventoryImportService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(FiscalConfiguration)
    private readonly fiscalRepository: Repository<FiscalConfiguration>,
    @InjectRepository(BillingBranch)
    private readonly branchRepository: Repository<BillingBranch>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    private readonly batchNumberGenerator: BatchNumberGeneratorService,
  ) {}

  assertOrganization(organizationId: string): void {
    if (organizationId !== MADERERIA_ORGANIZATION_ID) {
      throw new ForbiddenException(
        'Este módulo solo está disponible para Madereria Zona Norte',
      );
    }
  }

  /**
   * Valida archivo/contexto, crea job y corre la importación en background.
   * La UI hace poll a getJobStatus.
   */
  async startImportJob(params: {
    organizationId: string;
    userId: string;
    fiscalConfigurationId: string;
    billingBranchId: string;
    warehouseId: string;
    file: Express.Multer.File;
  }): Promise<ImportInventoryJob> {
    this.assertOrganization(params.organizationId);
    this.assertExcelFile(params.file);

    const warehouse = await this.assertWarehouseContext(
      params.organizationId,
      params.fiscalConfigurationId,
      params.billingBranchId,
      params.warehouseId,
    );

    let rows: InventoryExcelRow[];
    try {
      rows = parseMadereriaInventoryExcel(params.file.buffer);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'No se pudo leer el Excel',
      );
    }

    if (!rows.length) {
      throw new BadRequestException('El Excel no tiene renglones de inventario');
    }

    const job = createImportJob({
      id: uuidv4(),
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
        updateImportJob(job.id, {
          status: 'failed',
          message: 'Error al importar',
          error: err instanceof Error ? err.message : 'Error desconocido',
        });
      });
    });

    return job;
  }

  getJobStatus(jobId: string, organizationId: string): ImportInventoryJob {
    this.assertOrganization(organizationId);
    const job = getImportJob(jobId, organizationId);
    if (!job) {
      throw new NotFoundException('Trabajo de importación no encontrado');
    }
    return job;
  }

  /** Compat: import síncrono (tests / uso interno). */
  async importFile(params: {
    organizationId: string;
    userId: string;
    fiscalConfigurationId: string;
    billingBranchId: string;
    warehouseId: string;
    file: Express.Multer.File;
  }): Promise<ImportInventoryResult> {
    this.assertOrganization(params.organizationId);
    this.assertExcelFile(params.file);

    const warehouse = await this.assertWarehouseContext(
      params.organizationId,
      params.fiscalConfigurationId,
      params.billingBranchId,
      params.warehouseId,
    );

    let rows: InventoryExcelRow[];
    try {
      rows = parseMadereriaInventoryExcel(params.file.buffer);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'No se pudo leer el Excel',
      );
    }

    return this.executeImport({
      organizationId: params.organizationId,
      userId: params.userId,
      warehouse,
      rows,
    });
  }

  private async runImportJob(
    jobId: string,
    params: {
      organizationId: string;
      userId: string;
      warehouse: Warehouse;
      rows: InventoryExcelRow[];
    },
  ): Promise<void> {
    updateImportJob(jobId, {
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
          updateImportJob(jobId, {
            status: 'processing',
            processed,
            total,
            current_sku: sku,
            message: `Importando ${processed} de ${total}`,
          });
        },
      });

      updateImportJob(jobId, {
        status: 'completed',
        processed: result.file_rows,
        current_sku: null,
        message: `Listo: ${result.file_rows} renglones`,
        result,
        error: null,
      });
    } catch (error) {
      updateImportJob(jobId, {
        status: 'failed',
        message: 'Error al importar',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
      throw error;
    }
  }

  private async executeImport(params: {
    organizationId: string;
    userId: string;
    warehouse: Warehouse;
    rows: InventoryExcelRow[];
    onProgress?: (processed: number, total: number, sku: string | null) => void;
  }): Promise<ImportInventoryResult> {
    return this.dataSource.transaction(async (manager) => {
      const vendor = await this.ensureImportVendor(manager, params.organizationId);
      const priceList = await this.ensurePriceList(manager, params.organizationId);
      const piezaUomId = await this.ensurePiezaUom(manager, params.organizationId);

      const result: ImportInventoryResult = {
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
        } catch (error) {
          result.errors.push({
            sku: row.sku,
            row_number: row.row_number,
            message:
              error instanceof Error ? error.message : 'Error al importar renglón',
          });
        }
        processed += 1;
        params.onProgress?.(processed, params.rows.length, row.sku);
      }

      return result;
    });
  }

  private assertExcelFile(file?: Express.Multer.File): void {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Adjunta el archivo Excel de inventario');
    }
    const name = (file.originalname || '').toLowerCase();
    if (!name.endsWith('.xls') && !name.endsWith('.xlsx')) {
      throw new BadRequestException('Solo se aceptan archivos .xls o .xlsx');
    }
  }

  private async assertWarehouseContext(
    organizationId: string,
    fiscalId: string,
    branchId: string,
    warehouseId: string,
  ): Promise<Warehouse> {
    const fiscal = await this.fiscalRepository.findOne({
      where: { id: fiscalId, tenant_id: organizationId },
    });
    if (!fiscal) {
      throw new NotFoundException('Razón social no encontrada');
    }

    const branch = await this.branchRepository.findOne({
      where: { id: branchId, fiscal_configuration_id: fiscalId },
    });
    if (!branch) {
      throw new NotFoundException('La sucursal no pertenece a esa razón social');
    }

    const warehouse = await this.warehouseRepository.findOne({
      where: { id: warehouseId, tenant_id: organizationId },
    });
    if (!warehouse || warehouse.billing_branch_id !== branchId) {
      throw new NotFoundException('El almacén no pertenece a esa sucursal');
    }

    return warehouse;
  }

  private async importRow(
    manager: EntityManager,
    ctx: {
      organizationId: string;
      userId: string;
      warehouseId: string;
      vendorId: string;
      priceListId: string;
      piezaUomId: string;
      row: InventoryExcelRow;
      result: ImportInventoryResult;
    },
  ): Promise<void> {
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

    const productUom = await this.ensureBaseUom(
      manager,
      product.id,
      ctx.piezaUomId,
    );

    if (row.price != null && row.price > 0) {
      const createdPrice = await this.ensurePriceIfMissing(
        manager,
        product.id,
        ctx.priceListId,
        productUom.id,
        row.price,
      );
      if (createdPrice) {
        result.prices_created += 1;
      }
    }

    if (row.cost != null && row.cost > 0) {
      const costAction = await this.upsertImportCost(
        manager,
        product.id,
        ctx.vendorId,
        productUom.id,
        row.cost,
      );
      if (costAction === 'created') {
        result.costs_created += 1;
      } else {
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

    const batchNumber = await this.batchNumberGenerator.generateBatchNumber(
      ctx.warehouseId,
      ctx.organizationId,
      manager,
    );

    const batchRepo = manager.getRepository(InventoryBatch);
    await batchRepo.save(
      batchRepo.create({
        tenant_id: ctx.organizationId,
        batch_number: batchNumber,
        source_tag_identifier: 'IMPORTACION',
        warehouse_id: ctx.warehouseId,
        product_id: product.id,
        uom_id: productUom.uom_catalog_id,
        initial_quantity: row.quantity,
        available_quantity: row.quantity,
        created_by: ctx.userId,
      }),
    );
    result.batches_created += 1;
  }

  private async findProduct(
    manager: EntityManager,
    organizationId: string,
    row: InventoryExcelRow,
  ): Promise<Product | null> {
    const repo = manager.getRepository(Product);
    const found = await repo
      .createQueryBuilder('product')
      .where('product.tenant_id = :organizationId', { organizationId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(product.sku) = LOWER(:sku)', { sku: row.sku }).orWhere(
            'LOWER(product.external_sku) = LOWER(:sku)',
            { sku: row.sku },
          );
        }),
      )
      .getOne();
    if (found || !row.alternate_sku) {
      return found;
    }
    return repo
      .createQueryBuilder('product')
      .where('product.tenant_id = :organizationId', { organizationId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(product.sku) = LOWER(:alt)', {
            alt: row.alternate_sku,
          }).orWhere('LOWER(product.external_sku) = LOWER(:alt)', {
            alt: row.alternate_sku,
          });
        }),
      )
      .getOne();
  }

  private async createProduct(
    manager: EntityManager,
    organizationId: string,
    row: InventoryExcelRow,
    piezaUomId: string,
  ): Promise<Product> {
    const productRepo = manager.getRepository(Product);
    const product = await productRepo.save(
      productRepo.create({
        tenant_id: organizationId,
        sku: row.sku.slice(0, 255),
        external_sku: null,
        name: row.name.slice(0, 255),
        description: row.name,
        is_active: true,
      }),
    );

    const uomRepo = manager.getRepository(ProductUoM);
    await uomRepo.save(
      uomRepo.create({
        product_id: product.id,
        uom_catalog_id: piezaUomId,
        factor: 1,
        is_base: true,
        parent_uom_id: null,
      }),
    );

    return product;
  }

  private async ensureBaseUom(
    manager: EntityManager,
    productId: string,
    piezaUomId: string,
  ): Promise<ProductUoM> {
    const repo = manager.getRepository(ProductUoM);
    const existing = await repo.findOne({
      where: { product_id: productId, is_base: true },
    });
    if (existing) {
      return existing;
    }
    return repo.save(
      repo.create({
        product_id: productId,
        uom_catalog_id: piezaUomId,
        factor: 1,
        is_base: true,
        parent_uom_id: null,
      }),
    );
  }

  private async ensurePriceIfMissing(
    manager: EntityManager,
    productId: string,
    priceListId: string,
    productUomId: string,
    price: number,
  ): Promise<boolean> {
    const repo = manager.getRepository(ProductPrice);
    const existing = await repo.findOne({
      where: { product_id: productId, price_list_id: priceListId, product_uom_id: productUomId },
    });
    if (existing) {
      return false;
    }
    const totals = this.calculateTotals(price);
    await repo.save(
      repo.create({
        product_id: productId,
        price_list_id: priceListId,
        product_uom_id: productUomId,
        price,
        iva_percentage: DEFAULT_IVA_PERCENTAGE,
        ieps_percentage: DEFAULT_IEPS_PERCENTAGE,
        ...totals,
      }),
    );
    return true;
  }

  private async upsertImportCost(
    manager: EntityManager,
    productId: string,
    vendorId: string,
    productUomId: string,
    cost: number,
  ): Promise<'created' | 'updated'> {
    const repo = manager.getRepository(ProductVendorCost);
    const existing = await repo.findOne({
      where: { product_id: productId, vendor_id: vendorId, product_uom_id: productUomId },
    });
    const totals = this.calculateTotals(cost);
    if (existing) {
      Object.assign(existing, {
        cost,
        iva_percentage: DEFAULT_IVA_PERCENTAGE,
        ieps_percentage: DEFAULT_IEPS_PERCENTAGE,
        ...totals,
      });
      await repo.save(existing);
      return 'updated';
    }
    await repo.save(
      repo.create({
        product_id: productId,
        vendor_id: vendorId,
        product_uom_id: productUomId,
        cost,
        iva_percentage: DEFAULT_IVA_PERCENTAGE,
        ieps_percentage: DEFAULT_IEPS_PERCENTAGE,
        ...totals,
      }),
    );
    return 'created';
  }

  private async ensureImportVendor(
    manager: EntityManager,
    organizationId: string,
  ): Promise<Vendor> {
    const repo = manager.getRepository(Vendor);
    const existing = await repo
      .createQueryBuilder('vendor')
      .where('vendor.tenant_id = :organizationId', { organizationId })
      .andWhere('UPPER(vendor.name) = :name', { name: IMPORT_VENDOR_NAME })
      .getOne();
    if (existing) {
      return existing;
    }
    return repo.save(
      repo.create({
        tenant_id: organizationId,
        name: IMPORT_VENDOR_NAME,
        company_name: IMPORT_VENDOR_NAME,
        vendor_type: VendorType.NATIONAL,
        status: 'active',
        // BD exige varios campos NOT NULL sin default (entidad marca nullable).
        street: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'México',
        razon_social: IMPORT_VENDOR_NAME,
        rfc: '',
        legal_name: IMPORT_VENDOR_NAME,
        tax_id: '',
      }),
    );
  }

  private async ensurePriceList(
    manager: EntityManager,
    organizationId: string,
  ): Promise<PriceList> {
    const repo = manager.getRepository(PriceList);
    const existing = await repo.findOne({
      where: { tenant_id: organizationId, is_active: true },
      order: { created_at: 'ASC' },
    });
    if (existing) {
      return existing;
    }
    return repo.save(
      repo.create({
        tenant_id: organizationId,
        name: 'General',
        description: 'Lista creada por importación de inventario',
        is_active: true,
      }),
    );
  }

  private async ensurePiezaUom(
    manager: EntityManager,
    organizationId: string,
  ): Promise<string> {
    const repo = manager.getRepository(UoMCatalog);
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
    const created = await repo.save(
      repo.create({
        tenant_id: organizationId,
        name: DEFAULT_UOM_NAME,
        description: 'UoM por defecto para importación',
      }),
    );
    return created.id;
  }

  private calculateTotals(amount: number) {
    const subtotal = amount;
    const iva_unit_total = (amount * DEFAULT_IVA_PERCENTAGE) / 100;
    const ieps_unit_total = (amount * DEFAULT_IEPS_PERCENTAGE) / 100;
    return {
      subtotal: Number(subtotal.toFixed(2)),
      iva_unit_total: Number(iva_unit_total.toFixed(2)),
      ieps_unit_total: Number(ieps_unit_total.toFixed(2)),
      total: Number((subtotal + iva_unit_total + ieps_unit_total).toFixed(2)),
    };
  }
}
