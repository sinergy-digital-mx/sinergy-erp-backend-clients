import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { VendorProductPriceRepository } from '../repositories/vendor-product-price.repository';
import { UoMRepository } from '../repositories/uom.repository';
import { VendorProductPrice } from '../../../entities/products/vendor-product-price.entity';

@Injectable()
export class VendorProductPriceService {
  constructor(
    private vendorPriceRepository: VendorProductPriceRepository,
    private uomRepository: UoMRepository,
  ) {}

  async createPrice(
    vendorId: string,
    productId: string,
    uomId: string,
    price: number,
  ): Promise<VendorProductPrice> {
    // Validate price >= 0
    if (price < 0) {
      throw new BadRequestException('Price must be greater than or equal to zero');
    }

    // Validate UoM belongs to product
    const uom = await this.uomRepository.findById(uomId);
    if (!uom) {
      throw new NotFoundException(`UoM with ID ${uomId} not found`);
    }

    if (uom.product_id !== productId) {
      throw new BadRequestException('The specified UoM does not belong to this product');
    }

    return this.vendorPriceRepository.create({
      vendor_id: vendorId,
      product_id: productId,
      uom_id: uomId,
      price,
    });
  }

  async getPrice(id: string): Promise<VendorProductPrice> {
    const price = await this.vendorPriceRepository.findById(id);
    if (!price) {
      throw new NotFoundException(`Vendor Product Price with ID ${id} not found`);
    }
    return price;
  }

  async getPricesByProduct(productId: string): Promise<VendorProductPrice[]> {
    return this.vendorPriceRepository.findByProduct(productId);
  }

  async getPricesByVendor(vendorId: string): Promise<VendorProductPrice[]> {
    return this.vendorPriceRepository.findByVendor(vendorId);
  }

  async getPriceByVendorProductUoM(
    vendorId: string,
    productId: string,
    uomId: string,
  ): Promise<VendorProductPrice> {
    const price = await this.vendorPriceRepository.findByVendorProductUoM(
      vendorId,
      productId,
      uomId,
    );
    if (!price) {
      throw new NotFoundException(
        `Vendor Product Price for vendor ${vendorId}, product ${productId}, and UoM ${uomId} not found`,
      );
    }
    return price;
  }

  async updatePrice(id: string, price: number): Promise<VendorProductPrice | null> {
    // Validate price >= 0
    if (price < 0) {
      throw new BadRequestException('Price must be greater than or equal to zero');
    }

    await this.getPrice(id);
    return this.vendorPriceRepository.update(id, { price });
  }

  async deletePrice(id: string): Promise<void> {
    await this.getPrice(id);
    await this.vendorPriceRepository.delete(id);
  }
}
