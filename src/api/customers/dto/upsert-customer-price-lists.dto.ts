import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CustomerPriceListAssignmentDto {
  @ApiProperty()
  @IsUUID()
  price_list_id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class UpsertCustomerPriceListsDto {
  @ApiProperty({ type: [CustomerPriceListAssignmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerPriceListAssignmentDto)
  price_lists: CustomerPriceListAssignmentDto[];
}
