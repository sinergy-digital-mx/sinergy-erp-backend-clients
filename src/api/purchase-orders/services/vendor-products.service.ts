import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductUoM, ProductVendorCost } from '../../../entities/products';
import { QueryVendorProductsDto } from '../dto/query-vendor-products.dto';

export interface VendorProductUom {
  product_uom_id: string;
  uom_id: string;
  uom_name: string;
  factor: number;
  is_base: boolean;
  cost: number;
  iva_percentage: number;
  ieps_percentage: number;
  iva_unit_total: number;
  ieps_unit_total: number;
  subtotal: number;
  /** null si esa UOM no tiene costo de este proveedor. */
  currency: 'MXN' | 'USD' | null;
}

export interface VendorProduct {
  product_id: string;
  product_name: string;
  product_sku: string;
  sku: string;
  has_vendor_cost: boolean;
  uoms: VendorProductUom[];
}

@Injectable()
export class VendorProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductUoM)
    private readonly productUomRepository: Repository<ProductUoM>,
    @InjectRepository(ProductVendorCost)
    private readonly productVendorCostRepository: Repository<ProductVendorCost>,
  ) {}

  async getVendorProducts(
    vendorId: string,
    tenantId: string,
    query: QueryVendorProductsDto = {},
  ): Promise<VendorProduct[]> {
    const includeWithoutCost = this.shouldIncludeWithoutCost(query);
    const search = query.search?.trim() || '';

    if (!includeWithoutCost) {
      return this.listProductsWithVendorCost(vendorId, tenantId, search);
    }

    return this.listActiveCatalog(vendorId, tenantId, search);
  }

  private shouldIncludeWithoutCost(query: QueryVendorProductsDto): boolean {
    if (query.only_with_cost === true) return false;
    return query.include_without_cost !== false;
  }

  private async listActiveCatalog(
    vendorId: string,
    tenantId: string,
    search: string,
  ): Promise<VendorProduct[]> {
    const productsQb = this.productRepository
      .createQueryBuilder('product')
      .where('product.tenant_id = :tenantId', { tenantId })
      .andWhere('product.is_active = :isActive', { isActive: true });

    this.applyProductSearch(productsQb, search);
    productsQb.orderBy('product.name', 'ASC');

    const products = await productsQb.getMany();
    if (products.length === 0) return [];

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

  private async listProductsWithVendorCost(
    vendorId: string,
    tenantId: string,
    search: string,
  ): Promise<VendorProduct[]> {
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
    const byProduct = new Map<string, VendorProduct>();

    for (const vendorCost of vendorCosts) {
      const uomEntry = this.mapUomFromCost(vendorCost);
      const existing = byProduct.get(vendorCost.product_id);
      if (existing) {
        existing.uoms.push(uomEntry);
        continue;
      }

      byProduct.set(
        vendorCost.product_id,
        this.toVendorProduct(vendorCost.product, [uomEntry], true),
      );
    }

    return Array.from(byProduct.values());
  }

  private async loadProductUoms(productIds: string[]): Promise<Map<string, ProductUoM[]>> {
    const rows = await this.productUomRepository
      .createQueryBuilder('product_uom')
      .leftJoinAndSelect('product_uom.uom', 'uom')
      .where('product_uom.product_id IN (:...productIds)', { productIds })
      .orderBy('product_uom.is_base', 'DESC')
      .addOrderBy('uom.name', 'ASC')
      .getMany();

    const byProduct = new Map<string, ProductUoM[]>();
    for (const row of rows) {
      const list = byProduct.get(row.product_id) ?? [];
      list.push(row);
      byProduct.set(row.product_id, list);
    }
    return byProduct;
  }

  private async loadCostsByProductUom(
    vendorId: string,
    productIds: string[],
  ): Promise<Map<string, ProductVendorCost>> {
    const vendorCosts = await this.productVendorCostRepository
      .createQueryBuilder('pvc')
      .innerJoinAndSelect('pvc.product_uom', 'product_uom')
      .leftJoinAndSelect('product_uom.uom', 'uom')
      .where('pvc.vendor_id = :vendorId', { vendorId })
      .andWhere('pvc.product_id IN (:...productIds)', { productIds })
      .getMany();

    const byProductUom = new Map<string, ProductVendorCost>();
    for (const vendorCost of vendorCosts) {
      byProductUom.set(vendorCost.product_uom_id, vendorCost);
    }
    return byProductUom;
  }

  private applyProductSearch(
    qb: { andWhere: (where: string, params?: Record<string, string>) => unknown },
    search: string,
  ): void {
    if (!search) return;
    qb.andWhere(this.productSearchSql(), this.productSearchParams(search));
  }

  private productSearchSql(): string {
    return `(LOWER(product.name) LIKE LOWER(:search)
      OR LOWER(product.sku) LIKE LOWER(:search)
      OR LOWER(product.external_sku) LIKE LOWER(:search))`;
  }

  private productSearchParams(search: string): Record<string, string> {
    return search ? { search: `%${search}%` } : {};
  }

  private toVendorProduct(
    product: Product,
    uoms: VendorProductUom[],
    hasVendorCost: boolean,
  ): VendorProduct {
    return {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      sku: product.sku,
      has_vendor_cost: hasVendorCost,
      uoms,
    };
  }

  private mapUomWithoutCost(productUom: ProductUoM): VendorProductUom {
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

  private mapUomFromCost(vendorCost: ProductVendorCost): VendorProductUom {
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
}
