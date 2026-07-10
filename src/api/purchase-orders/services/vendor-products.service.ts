import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVendorCost } from '../../../entities/products';

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
}

export interface VendorProduct {
  product_id: string;
  product_name: string;
  product_sku: string;
  uoms: VendorProductUom[];
}

@Injectable()
export class VendorProductsService {
  constructor(
    @InjectRepository(ProductVendorCost)
    private readonly productVendorCostRepository: Repository<ProductVendorCost>,
  ) {}

  async getVendorProducts(vendorId: string, tenantId: string): Promise<VendorProduct[]> {
    const vendorCosts = await this.productVendorCostRepository
      .createQueryBuilder('pvc')
      .innerJoinAndSelect('pvc.product', 'product')
      .innerJoinAndSelect('pvc.product_uom', 'product_uom')
      .leftJoinAndSelect('product_uom.uom', 'uom')
      .where('pvc.vendor_id = :vendorId', { vendorId })
      .andWhere('product.tenant_id = :tenantId', { tenantId })
      .getMany();

    const byProduct = new Map<string, VendorProduct>();

    for (const vendorCost of vendorCosts) {
      const product = vendorCost.product;
      const productUom = vendorCost.product_uom;
      const factor = Number(productUom.factor) || 1;
      const cost = Number(vendorCost.cost);
      const ivaPercentage = Number(vendorCost.iva_percentage) || 0;
      const iepsPercentage = Number(vendorCost.ieps_percentage) || 0;
      const subtotal = cost * factor;
      const ivaAmount = subtotal * (ivaPercentage / 100);
      const iepsAmount = subtotal * (iepsPercentage / 100);

      const uomEntry: VendorProductUom = {
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
      };

      const existing = byProduct.get(product.id);
      if (existing) {
        existing.uoms.push(uomEntry);
        continue;
      }

      byProduct.set(product.id, {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        uoms: [uomEntry],
      });
    }

    return Array.from(byProduct.values());
  }
}
