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
  vendorImportFilename,
  VendorImportTemplateRow,
} from '../utils/product-vendor-import-excel.util';
import { formatExportDateTime } from '../../../common/utils/excel-export.util';

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
    const vendor = await this.requireVendor(orgId, vendorId);
    const costs = await this.loadVendorCosts(orgId, vendorId);
    return {
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      product_count: new Set(costs.map((c) => c.product_id)).size,
      row_count: costs.length,
    };
  }

  async previewPrices(
    orgId: string,
    vendorId: string,
    priceListId: string,
  ): Promise<VendorImportPreview> {
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
      title: `Costos — ${vendor.name}`,
      subtitle: [
        `Generado: ${formatExportDateTime(new Date())}`,
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

    return { buffer, filename: vendorImportFilename('cost', vendor.name) };
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
      title: `Precios — ${vendor.name}`,
      subtitle: [
        `Lista: ${priceList.name}`,
        `Generado: ${formatExportDateTime(new Date())}`,
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
      filename: vendorImportFilename('price', vendor.name, priceList.name),
    };
  }

  async importCosts(
    orgId: string,
    vendorId: string,
    file: Express.Multer.File,
  ): Promise<VendorImportResult> {
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

      const totals = this.calculateTotals(
        nextCost,
        this.toNumber(match.iva_percentage),
        this.toNumber(match.ieps_percentage),
      );
      match.cost = nextCost;
      Object.assign(match, totals);
      await this.vendorCostRepo.save(match);
      result.updated += 1;
    }

    return result;
  }

  async importPrices(
    orgId: string,
    vendorId: string,
    priceListId: string,
    file: Express.Multer.File,
  ): Promise<VendorImportResult> {
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
          this.toNumber(existing.ieps_percentage),
        );
        existing.price = nextPrice;
        Object.assign(existing, totals);
        await this.productPriceRepo.save(existing);
        result.updated += 1;
        continue;
      }

      const totals = this.calculateTotals(
        nextPrice,
        this.toNumber(cost.iva_percentage),
        this.toNumber(cost.ieps_percentage),
      );
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

  private parseFile(buffer: Buffer, kind: 'cost' | 'price'): ParsedVendorImportRow[] {
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
    return Number((Number(cost) || 0).toFixed(4));
  }

  private roundPrice(price: number): number {
    return Number((Number(price) || 0).toFixed(2));
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
    return { updated: 0, created: 0, skipped: 0, errors: [] };
  }
}
