import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from '../../../entities/products/product.entity';
import { ProductUoM } from '../../../entities/products/product-uom.entity';
import { PriceList } from '../../../entities/products/price-list.entity';
import { ProductPrice } from '../../../entities/products/product-price.entity';
import { ProductVendorCost } from '../../../entities/products/product-vendor-cost.entity';
import { QueryProductExportDto } from '../dto/query-product-export.dto';
import {
  buildExportSubtitle,
  buildStyledExcelBuffer,
  ExcelColumnDef,
  formatExportDateTime,
} from '../../../common/utils/excel-export.util';

type CatalogRow = Record<string, string | number | null>;

@Injectable()
export class ProductsExportService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductUoM)
    private readonly productUomRepo: Repository<ProductUoM>,
    @InjectRepository(PriceList)
    private readonly priceListRepo: Repository<PriceList>,
    @InjectRepository(ProductPrice)
    private readonly productPriceRepo: Repository<ProductPrice>,
    @InjectRepository(ProductVendorCost)
    private readonly vendorCostRepo: Repository<ProductVendorCost>,
  ) {}

  getFilename(): string {
    const date = new Date().toISOString().slice(0, 10);
    return `catalogo-productos-${date}.xlsx`;
  }

  async exportCatalog(orgId: string, filters: QueryProductExportDto): Promise<Buffer> {
    const products = await this.fetchProducts(orgId, filters);
    const productIds = products.map((p) => p.id);
    const priceLists = await this.priceListRepo.find({
      where: { tenant_id: orgId },
      order: { is_active: 'DESC', name: 'ASC' },
    });

    const uoms = productIds.length
      ? await this.productUomRepo.find({
          where: { product_id: In(productIds) },
          relations: ['uom'],
        })
      : [];
    const uomsByProduct = new Map<string, ProductUoM[]>();
    for (const uom of uoms) {
      const list = uomsByProduct.get(uom.product_id) ?? [];
      list.push(uom);
      uomsByProduct.set(uom.product_id, list);
    }

    const uomIds = uoms.map((u) => u.id);
    const costs = uomIds.length
      ? await this.vendorCostRepo.find({ where: { product_uom_id: In(uomIds) } })
      : [];
    const prices = uomIds.length
      ? await this.productPriceRepo.find({ where: { product_uom_id: In(uomIds) } })
      : [];

    const costsByUom = this.groupNumbers(
      costs.map((c) => ({ key: c.product_uom_id, value: Number(c.cost) })),
    );
    const pricesByUom = this.groupNumbers(
      prices.map((p) => ({ key: p.product_uom_id, value: Number(p.price) })),
    );
    const priceByUomAndList = new Map<string, number>();
    for (const price of prices) {
      priceByUomAndList.set(
        `${price.product_uom_id}:${price.price_list_id}`,
        Number(price.price),
      );
    }

    const columns = this.buildColumns(priceLists);
    const rows: CatalogRow[] = [];

    for (const product of products) {
      const productUoms = uomsByProduct.get(product.id) ?? [];
      if (productUoms.length === 0) {
        rows.push(this.buildRow(product, null, null, null, priceLists, priceByUomAndList));
        continue;
      }

      const sorted = [...productUoms].sort((a, b) => {
        if (a.is_base !== b.is_base) return a.is_base ? -1 : 1;
        return (a.uom?.name ?? '').localeCompare(b.uom?.name ?? '', 'es');
      });

      for (const uom of sorted) {
        rows.push(
          this.buildRow(
            product,
            uom,
            this.average(costsByUom.get(uom.id)),
            this.average(pricesByUom.get(uom.id)),
            priceLists,
            priceByUomAndList,
          ),
        );
      }
    }

    return buildStyledExcelBuffer({
      sheetName: 'Catálogo',
      title: 'Catálogo de productos',
      subtitle: buildExportSubtitle([
        `Generado: ${formatExportDateTime(new Date())}`,
        `Registros: ${rows.length}`,
        this.describeFilters(filters),
      ]),
      columns,
      rows,
      headerColor: 'FF5B4B8A',
      titleColor: 'FF3D3166',
    });
  }

  private buildColumns(priceLists: PriceList[]): ExcelColumnDef[] {
    const columns: ExcelColumnDef[] = [
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

  private buildRow(
    product: Product,
    uom: ProductUoM | null,
    avgCost: number | null,
    avgPrice: number | null,
    priceLists: PriceList[],
    priceByUomAndList: Map<string, number>,
  ): CatalogRow {
    const row: CatalogRow = {
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

  private async fetchProducts(
    orgId: string,
    query: QueryProductExportDto,
  ): Promise<Product[]> {
    const { search, sku, external_sku, name, category_id, subcategory_id, is_active } = query;
    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subcategory', 'subcategory')
      .where('product.tenant_id = :orgId', { orgId });

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      queryBuilder.andWhere(
        `(LOWER(product.name) LIKE LOWER(:search)
          OR LOWER(product.sku) LIKE LOWER(:search)
          OR LOWER(product.external_sku) LIKE LOWER(:search))`,
        { search: term },
      );
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

  private groupNumbers(items: { key: string; value: number }[]): Map<string, number[]> {
    const map = new Map<string, number[]>();
    for (const item of items) {
      if (!Number.isFinite(item.value)) continue;
      const list = map.get(item.key) ?? [];
      list.push(item.value);
      map.set(item.key, list);
    }
    return map;
  }

  private average(values: number[] | undefined): number | null {
    if (!values?.length) return null;
    const sum = values.reduce((acc, n) => acc + n, 0);
    return Math.round((sum / values.length) * 100) / 100;
  }

  private priceListKey(id: string): string {
    return `price_list_${id}`;
  }

  private describeFilters(filters: QueryProductExportDto): string {
    const parts: string[] = [];
    if (filters.search) parts.push(`Búsqueda: ${filters.search}`);
    if (filters.sku) parts.push(`SKU: ${filters.sku}`);
    if (filters.external_sku) parts.push(`SKU externo: ${filters.external_sku}`);
    if (filters.name) parts.push(`Nombre: ${filters.name}`);
    if (filters.category_id) parts.push('Categoría filtrada');
    if (filters.subcategory_id) parts.push('Subcategoría filtrada');
    if (filters.is_active === true) parts.push('Solo activos');
    if (filters.is_active === false) parts.push('Solo inactivos');
    return parts.join(' | ');
  }
}
