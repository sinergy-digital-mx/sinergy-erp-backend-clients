import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductUoM, ProductVendorCost } from '../../../entities/products';

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

  async getVendorProducts(vendorId: string, tenantId: string): Promise<any[]> {
    // Get all products for the tenant
    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.tenant_id = :tenantId', { tenantId })
      .getMany();

    // Build response with UOM and pricing information
    const result: any[] = [];

    for (const product of products) {
      // Get all UOMs for this product
      const productUoms = await this.productUomRepository
        .createQueryBuilder('product_uom')
        .leftJoinAndSelect('product_uom.uom', 'uom')
        .where('product_uom.product_id = :productId', { productId: product.id })
        .getMany();

      const uoms: any[] = [];

      for (const productUom of productUoms) {
        // Get vendor cost for this product UOM
        const vendorCost = await this.productVendorCostRepository.findOne({
          where: {
            product_uom_id: productUom.id,
            vendor_id: vendorId,
          },
        });

        if (vendorCost) {
          const subtotal = vendorCost.cost * (productUom.factor || 1);
          const ivaAmount = subtotal * ((vendorCost.iva_percentage || 0) / 100);
          const iepsAmount = subtotal * ((vendorCost.ieps_percentage || 0) / 100);

          uoms.push({
            product_uom_id: productUom.id,
            uom_id: productUom.uom_catalog_id,
            uom_name: productUom.uom?.name || 'Unknown',
            factor: productUom.factor || 1,
            is_base: productUom.is_base || false,
            cost: vendorCost.cost,
            iva_percentage: vendorCost.iva_percentage || 0,
            ieps_percentage: vendorCost.ieps_percentage || 0,
            iva_unit_total: ivaAmount,
            ieps_unit_total: iepsAmount,
            subtotal: subtotal,
          });
        }
      }

      if (uoms.length > 0) {
        result.push({
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          uoms,
        });
      }
    }

    return result;
  }
}
