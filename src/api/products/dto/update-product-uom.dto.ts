import { PartialType } from '@nestjs/swagger';
import { CreateProductUoMDto } from './create-product-uom.dto';

export class UpdateProductUoMDto extends PartialType(CreateProductUoMDto) {}
