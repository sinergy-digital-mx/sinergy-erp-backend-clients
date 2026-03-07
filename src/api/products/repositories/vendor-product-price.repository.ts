import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorProductPrice } from '../../../entities/products/vendor-product-price.entity';

@Injectable()
export class VendorProductPriceRepository {
  constructor(
    @InjectRepository(VendorProductPrice)
    private repo: Repository<VendorProductPrice>,
  ) {}

  async create(price: Partial<VendorProductPrice>): Promise<VendorProductPrice> {
    const newPrice = this.repo.create(price);
    return this.repo.save(newPrice);
  }

  async findById(id: string): Promise<VendorProductPrice | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['vendor', 'product', 'uom'],
    });
  }

  async findByProduct(productId: string): Promise<VendorProductPrice[]> {
    return this.repo.find({
      where: { product_id: productId },
      relations: ['vendor', 'product', 'uom'],
    });
  }

  async findByVendor(vendorId: string): Promise<VendorProductPrice[]> {
    return this.repo.find({
      where: { vendor_id: vendorId },
      relations: ['vendor', 'product', 'uom'],
    });
  }

  async findByVendorProductUoM(
    vendorId: string,
    productId: string,
    uomId: string,
  ): Promise<VendorProductPrice | null> {
    return this.repo.findOne({
      where: { vendor_id: vendorId, product_id: productId, uom_id: uomId },
      relations: ['vendor', 'product', 'uom'],
    });
  }

  async update(id: string, updates: Partial<VendorProductPrice>): Promise<VendorProductPrice | null> {
    await this.repo.update(id, updates);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
