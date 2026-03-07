import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { VendorProductPriceService } from '../services/vendor-product-price.service';
import { CreateVendorProductPriceDto } from '../dto/create-vendor-product-price.dto';
import { UpdateVendorProductPriceDto } from '../dto/update-vendor-product-price.dto';
import { VendorProductPrice } from '../../../entities/products/vendor-product-price.entity';

@Controller('vendor-product-prices')
export class VendorProductPriceController {
  constructor(private vendorPriceService: VendorProductPriceService) {}

  @Post()
  async create(@Body() dto: CreateVendorProductPriceDto): Promise<VendorProductPrice> {
    return this.vendorPriceService.createPrice(
      dto.vendor_id,
      dto.product_id,
      dto.uom_id,
      dto.price,
    );
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<VendorProductPrice> {
    return this.vendorPriceService.getPrice(id);
  }

  @Get('products/:productId/vendor-prices')
  async getByProduct(@Param('productId') productId: string): Promise<VendorProductPrice[]> {
    return this.vendorPriceService.getPricesByProduct(productId);
  }

  @Get('vendors/:vendorId/product-prices')
  async getByVendor(@Param('vendorId') vendorId: string): Promise<VendorProductPrice[]> {
    return this.vendorPriceService.getPricesByVendor(vendorId);
  }

  @Get('vendor/:vendorId/product/:productId/uom/:uomId')
  async getByVendorProductUoM(
    @Param('vendorId') vendorId: string,
    @Param('productId') productId: string,
    @Param('uomId') uomId: string,
  ): Promise<VendorProductPrice> {
    return this.vendorPriceService.getPriceByVendorProductUoM(vendorId, productId, uomId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVendorProductPriceDto,
  ): Promise<VendorProductPrice | null> {
    if (dto.price === undefined) {
      throw new Error('Price is required');
    }
    return this.vendorPriceService.updatePrice(id, dto.price);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.vendorPriceService.deletePrice(id);
  }
}
