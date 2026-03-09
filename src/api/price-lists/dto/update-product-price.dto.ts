import { PartialType } from '@nestjs/mapped-types';
import { CreateProductPriceDto } from './create-product-price.dto';
import { OmitType } from '@nestjs/mapped-types';

export class UpdateProductPriceDto extends PartialType(
  OmitType(CreateProductPriceDto, ['product_id', 'price_list_id'] as const)
) {}
