import { PartialType } from '@nestjs/swagger';
import { CreateProductVendorCostDto } from './create-product-vendor-cost.dto';

export class UpdateProductVendorCostDto extends PartialType(CreateProductVendorCostDto) {}
