import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProductVendorCost } from '../../../entities/products/product-vendor-cost.entity';
import { ProductPrice } from '../../../entities/products/product-price.entity';
import { PriceList } from '../../../entities/products/price-list.entity';
import { Vendor } from '../../../entities/vendor/vendor.entity';
import {
  buildVendorImportTemplate,
  parseVendorImportExcel,
  ParsedVendorImportRow,
  VendorImportKind,
  vendorImportFilename,
  VendorImportTemplateRow,
} from '../utils/product-vendor-import-excel.util';
import { formatExportDateTime } from '../../../common/utils/excel-export.util';
import { roundUnitAmount } from '../../../common/utils/unit-amount.util';
import { loadTenantIepsEnabled } from '../../billing/utils/fiscal-tax-policy.util';
import { vendorCompanyName } from '../../vendor/utils/vendor-profile.util';

export interface VendorImportPreview {
  vendor_id: string;
  vendor_name: string;
  price_list_id?: string;
  price_list_name?: string;
  product_count: number;
  row_count: number;
}

export interface VendorImportError {
  row: number;
  sku: string;
  message: string;
}

export interface VendorImportResult {
  updated: number;
  created: number;
  skipped: number;
  costs_updated: number;
  prices_updated: number;
  prices_created: number;
  errors: VendorImportError[];
}

type LoadedVendorCost = ProductVendorCost & {
  product: { id: string; sku: string; name: string; is_active: boolean; tenant_id: string };
  product_uom: { id: string; is_base: boolean; uom?: { name: string } };
};

@Injectable()
export class ProductVendorImportService {
  constructor(
    @InjectRepository(ProductVendorCost)
    private readonly vendorCostRepo: Repository<ProductVendorCost>,
    @InjectRepository(ProductPrice)
    private readonly productPriceRepo: Repository<ProductPrice>,
    @InjectRepository(PriceList)
    private readonly priceListRepo: Repository<PriceList>,
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
  ) {}

  async previewCosts(orgId: string, vendorId: string): Promise<VendorImportPreview> {
    return this.previewCatalog(orgId, vendorId);
  }

  async previewPrices(
    orgId: string,
    vendorId: string,
    priceListId: string,
  ): Promise<VendorImportPreview> {
    return this.previewCatalog(orgId, vendorId, priceListId);
  }

  async previewCatalog(
    orgId: string,
    vendorId: string,
    priceListId?: string,
  ): Promise<VendorImportPreview> {
    const vendor = await this.requireVendor(orgId, vendorId);
    const costs = await this.loadVendorCosts(orgId, vendorId);
    const preview: VendorImportPreview = {
      vendor_id: vendor.id,
      vendor_name: vendorCompanyName(vendor),
      product_count: new Set(costs.map((c) => c.product_id)).size,
      row_count: costs.length,
    };
    if (priceListId) {
      const priceList = await this.requirePriceList(orgId, priceListId);
      preview.price_list_id = priceList.id;
      preview.price_list_name = priceList.name;
    }
    return preview;
  }

  async exportCostTemplate(
    orgId: string,
    vendorId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const vendor = await this.requireVendor(orgId, vendorId);
    const costs = await this.loadVendorCosts(orgId, vendorId);
    if (!costs.length) {
      throw new BadRequestException(
        'Este proveedor no tiene productos con costo. Agrégalos en el catálogo primero.',
      );
    }

    const rows: VendorImportTemplateRow[] = costs.map((cost) => ({
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

    const buffer = await buildVendorImportTemplate({
      kind: 'cost',
      title: `Costos — ${vendorCompanyName(vendor)}`,
      subtitle: [
        `Generado: ${formatExportDateTime(new Date())}`,
        `${rows.length} renglones`,
        'Llena solo Nuevo costo. Vacío = no cambia.',
        'No afecta OC / OV ya creadas.',
      ].join('  •  '),
      contextLines: [
        `Proveedor: ${vendorCompanyName(vendor)}`,
        `Renglones: ${rows.length} (un renglón por producto + UOM)`,
      ],
      rows,
    });

    return { buffer, filename: vendorImportFilename('cost', vendorCompanyName(vendor)) };
  }

  async exportPriceTemplate(
    orgId: string,
    vendorId: string,
    priceListId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const vendor = await this.requireVendor(orgId, vendorId);
    const priceList = await this.requirePriceList(orgId, priceListId);
    const costs = await this.loadVendorCosts(orgId, vendorId);
    if (!costs.length) {
      throw new BadRequestException(
        'Este proveedor no tiene productos con costo. Agrégalos en el catálogo primero.',
      );
    }

    const prices = await this.productPriceRepo.find({
      where: {
        product_uom_id: In(costs.map((c) => c.product_uom_id)),
        price_list_id: priceListId,
      },
    });
    const priceByUom = new Map(prices.map((p) => [p.product_uom_id, p]));

    const rows: VendorImportTemplateRow[] = costs.map((cost) => {
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

    const buffer = await buildVendorImportTemplate({
      kind: 'price',
      title: `Precios — ${vendorCompanyName(vendor)}`,
      subtitle: [
        `Lista: ${priceList.name}`,
        `Generado: ${formatExportDateTime(new Date())}`,
        `${rows.length} renglones`,
        'Llena solo Nuevo precio. Vacío = no cambia.',
        'No afecta OV ya creadas.',
      ].join('  •  '),
      contextLines: [
        `Proveedor: ${vendorCompanyName(vendor)}`,
        `Lista de precios: ${priceList.name}`,
        `Renglones: ${rows.length} (productos de este proveedor en esta lista)`,
      ],
      rows,
    });

    return {
      buffer,
      filename: vendorImportFilename('price', vendorCompanyName(vendor), priceList.name),
    };
  }

  async exportCatalogTemplate(
    orgId: string,
    vendorId: string,
    priceListId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const vendor = await this.requireVendor(orgId, vendorId);
    const priceList = await this.requirePriceList(orgId, priceListId);
    const costs = await this.loadVendorCosts(orgId, vendorId);
    if (!costs.length) {
      throw new BadRequestException(
        'Este proveedor no tiene productos con costo. Agrégalos en el catálogo primero.',
      );
    }

    const prices = await this.productPriceRepo.find({
      where: {
        product_uom_id: In(costs.map((c) => c.product_uom_id)),
        price_list_id: priceListId,
      },
    });
    const priceByUom = new Map(prices.map((p) => [p.product_uom_id, p]));

    const rows: VendorImportTemplateRow[] = costs.map((cost) => {
      const price = priceByUom.get(cost.product_uom_id);
      return {
        sku: cost.product?.sku ?? '',
        name: cost.product?.name ?? '',
        uom: cost.product_uom?.uom?.name ?? '',
        currency: cost.currency ?? 'MXN',
        price_list: priceList.name,
        is_active: cost.product?.is_active ? 'Sí' : 'No',
        current_cost: this.toNumber(cost.cost),
        new_cost: null,
        current_price: price ? this.toNumber(price.price) : null,
        new_price: null,
        _cost_id: cost.id,
        _price_id: price?.id ?? '',
        _product_id: cost.product_id,
        _product_uom_id: cost.product_uom_id,
        _price_list_id: priceList.id,
      };
    });

    const buffer = await buildVendorImportTemplate({
      kind: 'catalog',
      title: `Costos y precios — ${vendorCompanyName(vendor)}`,
      subtitle: [
        `Lista: ${priceList.name}`,
        `Generado: ${formatExportDateTime(new Date())}`,
        `${rows.length} renglones`,
        'Llena Nuevo costo y/o Nuevo precio. Vacío = no cambia esa columna.',
        'No afecta OC / OV ya creadas.',
      ].join('  •  '),
      contextLines: [
        `Proveedor: ${vendorCompanyName(vendor)}`,
        `Lista de precios: ${priceList.name}`,
        `Renglones: ${rows.length} (un renglón por producto + UOM)`,
      ],
      rows,
    });

    return {
      buffer,
      filename: vendorImportFilename('catalog', vendorCompanyName(vendor), priceList.name),
    };
  }

  async importCosts(
    orgId: string,
    vendorId: string,
    file: Express.Multer.File,
  ): Promise<VendorImportResult> {
    const iepsEnabled = await loadTenantIepsEnabled(this.vendorCostRepo.manager, orgId);
    this.assertExcelFile(file);
    await this.requireVendor(orgId, vendorId);
    const costs = await this.loadVendorCosts(orgId, vendorId);
    const parsed = this.parseFile(file.buffer, 'cost');

    const byId = new Map(costs.map((c) => [c.id, c]));
    const bySkuUom = new Map(
      costs.map((c) => [this.skuUomKey(c.product?.sku ?? '', c.product_uom?.uom?.name ?? ''), c]),
    );

    const result = this.emptyResult();

    for (const row of parsed) {
      const nextCostValue = row.new_cost ?? row.new_value;
      if (nextCostValue === null) {
        result.skipped += 1;
        continue;
      }

      const amountError = this.validateAmount(nextCostValue, 'costo');
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

      const nextCost = this.roundUnitCost(nextCostValue);
      if (nextCost === this.roundUnitCost(this.toNumber(match.cost))) {
        result.skipped += 1;
        continue;
      }

      const totals = this.calculateTotals(
        nextCost,
        this.toNumber(match.iva_percentage),
        this.iepsValue(iepsEnabled, match.ieps_percentage),
      );
      match.cost = nextCost;
      if (!iepsEnabled) match.ieps_percentage = 0;
      Object.assign(match, totals);
      await this.vendorCostRepo.save(match);
      result.updated += 1;
      result.costs_updated += 1;
    }

    return result;
  }

  async importPrices(
    orgId: string,
    vendorId: string,
    priceListId: string,
    file: Express.Multer.File,
  ): Promise<VendorImportResult> {
    const iepsEnabled = await loadTenantIepsEnabled(this.vendorCostRepo.manager, orgId);
    this.assertExcelFile(file);
    await this.requireVendor(orgId, vendorId);
    await this.requirePriceList(orgId, priceListId);
    const costs = await this.loadVendorCosts(orgId, vendorId);
    const parsed = this.parseFile(file.buffer, 'price');

    const prices = costs.length
      ? await this.productPriceRepo.find({
          where: {
            product_uom_id: In(costs.map((c) => c.product_uom_id)),
            price_list_id: priceListId,
          },
        })
      : [];
    const priceById = new Map(prices.map((p) => [p.id, p]));
    const priceByUom = new Map(prices.map((p) => [p.product_uom_id, p]));
    const costBySkuUom = new Map(
      costs.map((c) => [this.skuUomKey(c.product?.sku ?? '', c.product_uom?.uom?.name ?? ''), c]),
    );
    const costByProductUom = new Map(costs.map((c) => [c.product_uom_id, c]));

    const result = this.emptyResult();

    for (const row of parsed) {
      const nextPriceValue = row.new_price ?? row.new_value;
      if (nextPriceValue === null) {
        result.skipped += 1;
        continue;
      }

      const amountError = this.validateAmount(nextPriceValue, 'precio');
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

      const nextPrice = this.roundPrice(nextPriceValue);
      const existing =
        (row.id ? priceById.get(row.id) : undefined) ?? priceByUom.get(cost.product_uom_id);

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
        const totals = this.calculateTotals(
          nextPrice,
          this.toNumber(existing.iva_percentage),
          this.iepsValue(iepsEnabled, existing.ieps_percentage),
        );
        existing.price = nextPrice;
        if (!iepsEnabled) existing.ieps_percentage = 0;
        Object.assign(existing, totals);
        await this.productPriceRepo.save(existing);
        result.updated += 1;
        result.prices_updated += 1;
        continue;
      }

      const totals = this.calculateTotals(
        nextPrice,
        this.toNumber(cost.iva_percentage),
        this.iepsValue(iepsEnabled, cost.ieps_percentage),
      );
      const created = this.productPriceRepo.create({
        product_id: cost.product_id,
        price_list_id: priceListId,
        product_uom_id: cost.product_uom_id,
        price: nextPrice,
        iva_percentage: this.toNumber(cost.iva_percentage),
        ieps_percentage: this.iepsValue(iepsEnabled, cost.ieps_percentage),
        ...totals,
      });
      const saved = await this.productPriceRepo.save(created);
      priceById.set(saved.id, saved);
      priceByUom.set(saved.product_uom_id, saved);
      result.created += 1;
      result.prices_created += 1;
    }

    return result;
  }

  async importCatalog(
    orgId: string,
    vendorId: string,
    priceListId: string,
    file: Express.Multer.File,
  ): Promise<VendorImportResult> {
    const iepsEnabled = await loadTenantIepsEnabled(this.vendorCostRepo.manager, orgId);
    this.assertExcelFile(file);
    await this.requireVendor(orgId, vendorId);
    await this.requirePriceList(orgId, priceListId);
    const costs = await this.loadVendorCosts(orgId, vendorId);
    const parsed = this.parseFile(file.buffer, 'catalog');

    const byCostId = new Map(costs.map((c) => [c.id, c]));
    const bySkuUom = new Map(
      costs.map((c) => [this.skuUomKey(c.product?.sku ?? '', c.product_uom?.uom?.name ?? ''), c]),
    );
    const costByProductUom = new Map(costs.map((c) => [c.product_uom_id, c]));
    const prices = costs.length
      ? await this.productPriceRepo.find({
          where: {
            product_uom_id: In(costs.map((c) => c.product_uom_id)),
            price_list_id: priceListId,
          },
        })
      : [];
    const priceById = new Map(prices.map((p) => [p.id, p]));
    const priceByUom = new Map(prices.map((p) => [p.product_uom_id, p]));

    const result = this.emptyResult();

    for (const row of parsed) {
      const nextCostValue = row.new_cost;
      const nextPriceValue = row.new_price;
      if (nextCostValue === null && nextPriceValue === null) {
        result.skipped += 1;
        continue;
      }

      const cost =
        this.matchCost(row, byCostId, bySkuUom) ??
        this.matchCostForPrice(row, bySkuUom, costByProductUom);
      if (!cost) {
        result.errors.push({
          row: row.row_number,
          sku: row.sku,
          message: 'El SKU no pertenece a este proveedor o la UOM no coincide.',
        });
        continue;
      }

      let changed = false;
      let rowHasError = false;

      if (nextCostValue !== null) {
        const amountError = this.validateAmount(nextCostValue, 'costo');
        if (amountError) {
          result.errors.push({ row: row.row_number, sku: row.sku, message: amountError });
          rowHasError = true;
        } else {
          const nextCost = this.roundUnitCost(nextCostValue);
          if (nextCost !== this.roundUnitCost(this.toNumber(cost.cost))) {
            const totals = this.calculateTotals(
              nextCost,
              this.toNumber(cost.iva_percentage),
              this.iepsValue(iepsEnabled, cost.ieps_percentage),
            );
            cost.cost = nextCost;
            if (!iepsEnabled) cost.ieps_percentage = 0;
            Object.assign(cost, totals);
            await this.vendorCostRepo.save(cost);
            result.costs_updated += 1;
            changed = true;
          }
        }
      }

      if (nextPriceValue !== null) {
        const amountError = this.validateAmount(nextPriceValue, 'precio');
        if (amountError) {
          result.errors.push({ row: row.row_number, sku: row.sku, message: amountError });
          rowHasError = true;
        } else {
          const nextPrice = this.roundPrice(nextPriceValue);
          const existing =
            (row.price_id ? priceById.get(row.price_id) : undefined) ??
            (row.id ? priceById.get(row.id) : undefined) ??
            priceByUom.get(cost.product_uom_id);

          if (existing) {
            if (existing.price_list_id !== priceListId || existing.product_id !== cost.product_id) {
              result.errors.push({
                row: row.row_number,
                sku: row.sku,
                message: 'El renglón no corresponde a esta lista de precios.',
              });
              rowHasError = true;
            } else if (nextPrice !== this.roundPrice(this.toNumber(existing.price))) {
              const totals = this.calculateTotals(
                nextPrice,
                this.toNumber(existing.iva_percentage),
                this.iepsValue(iepsEnabled, existing.ieps_percentage),
              );
              existing.price = nextPrice;
              if (!iepsEnabled) existing.ieps_percentage = 0;
              Object.assign(existing, totals);
              await this.productPriceRepo.save(existing);
              result.prices_updated += 1;
              changed = true;
            }
          } else {
            const totals = this.calculateTotals(
              nextPrice,
              this.toNumber(cost.iva_percentage),
              this.iepsValue(iepsEnabled, cost.ieps_percentage),
            );
            const created = this.productPriceRepo.create({
              product_id: cost.product_id,
              price_list_id: priceListId,
              product_uom_id: cost.product_uom_id,
              price: nextPrice,
              iva_percentage: this.toNumber(cost.iva_percentage),
              ieps_percentage: this.iepsValue(iepsEnabled, cost.ieps_percentage),
              ...totals,
            });
            const saved = await this.productPriceRepo.save(created);
            priceById.set(saved.id, saved);
            priceByUom.set(saved.product_uom_id, saved);
            result.prices_created += 1;
            changed = true;
          }
        }
      }

      if (!changed && !rowHasError) {
        result.skipped += 1;
      }
    }

    result.updated = result.costs_updated + result.prices_updated;
    result.created = result.prices_created;
    return result;
  }

  private async requireVendor(orgId: string, vendorId: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findOne({
      where: { id: vendorId, tenant_id: orgId },
    });
    if (!vendor) {
      throw new NotFoundException('Proveedor no encontrado');
    }
    return vendor;
  }

  private async requirePriceList(orgId: string, priceListId: string): Promise<PriceList> {
    const priceList = await this.priceListRepo.findOne({
      where: { id: priceListId, tenant_id: orgId },
    });
    if (!priceList) {
      throw new NotFoundException('Lista de precios no encontrada');
    }
    return priceList;
  }

  private async loadVendorCosts(orgId: string, vendorId: string): Promise<LoadedVendorCost[]> {
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

    return costs as LoadedVendorCost[];
  }

  private parseFile(buffer: Buffer, kind: VendorImportKind): ParsedVendorImportRow[] {
    try {
      const rows = parseVendorImportExcel(buffer, kind);
      if (!rows.length) {
        throw new BadRequestException('El archivo no tiene renglones de productos');
      }
      return rows;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : 'No se pudo leer el Excel';
      throw new BadRequestException(message);
    }
  }

  private assertExcelFile(file?: Express.Multer.File): asserts file is Express.Multer.File {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Adjunta el archivo Excel descargado');
    }
    const name = (file.originalname ?? '').toLowerCase();
    if (!name.endsWith('.xlsx')) {
      throw new BadRequestException('El archivo debe ser .xlsx (el template descargado)');
    }
  }

  private matchCost(
    row: ParsedVendorImportRow,
    byId: Map<string, LoadedVendorCost>,
    bySkuUom: Map<string, LoadedVendorCost>,
  ): LoadedVendorCost | undefined {
    if (row.cost_id && byId.has(row.cost_id)) return byId.get(row.cost_id);
    if (row.id && byId.has(row.id)) return byId.get(row.id);
    return bySkuUom.get(this.skuUomKey(row.sku, row.uom));
  }

  private matchCostForPrice(
    row: ParsedVendorImportRow,
    costBySkuUom: Map<string, LoadedVendorCost>,
    costByProductUom: Map<string, LoadedVendorCost>,
  ): LoadedVendorCost | undefined {
    if (row.product_uom_id && costByProductUom.has(row.product_uom_id)) {
      return costByProductUom.get(row.product_uom_id);
    }
    return costBySkuUom.get(this.skuUomKey(row.sku, row.uom));
  }

  private skuUomKey(sku: string, uom: string): string {
    return `${sku.trim().toLowerCase()}::${uom.trim().toLowerCase()}`;
  }

  private validateAmount(value: number, label: 'costo' | 'precio'): string | null {
    if (!Number.isFinite(value) || value < 0) {
      return `El ${label} debe ser un número mayor o igual a 0`;
    }
    return null;
  }

  private roundUnitCost(cost: number): number {
    return roundUnitAmount(cost);
  }

  private roundPrice(price: number): number {
    return roundUnitAmount(price);
  }

  private iepsValue(iepsEnabled: boolean, value: unknown): number {
    return iepsEnabled ? this.toNumber(value) : 0;
  }

  private calculateTotals(base: number, ivaPercentage: number, iepsPercentage: number) {
    const iva_unit_total = (base * ivaPercentage) / 100;
    const ieps_unit_total = (base * iepsPercentage) / 100;
    return {
      subtotal: Number(base.toFixed(2)),
      iva_unit_total: Number(iva_unit_total.toFixed(2)),
      ieps_unit_total: Number(ieps_unit_total.toFixed(2)),
      total: Number((base + iva_unit_total + ieps_unit_total).toFixed(2)),
    };
  }

  private toNumber(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private emptyResult(): VendorImportResult {
    return {
      updated: 0,
      created: 0,
      skipped: 0,
      costs_updated: 0,
      prices_updated: 0,
      prices_created: 0,
      errors: [],
    };
  }
}
