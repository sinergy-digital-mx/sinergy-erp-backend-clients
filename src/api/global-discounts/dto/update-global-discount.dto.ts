import { PartialType } from '@nestjs/swagger';
import { CreateGlobalDiscountDto } from './create-global-discount.dto';

export class UpdateGlobalDiscountDto extends PartialType(CreateGlobalDiscountDto) {}
