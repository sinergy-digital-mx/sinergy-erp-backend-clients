import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CorrectPurchaseReceiptLineDto {
  @IsUUID()
  line_item_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_total?: number;
}

export class CorrectPurchaseReceiptDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CorrectPurchaseReceiptLineDto)
  lines: CorrectPurchaseReceiptLineDto[];
}
