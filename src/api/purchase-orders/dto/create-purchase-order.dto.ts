import { IsUUID, IsString, IsDateString, IsOptional, IsEnum, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLineItemDto } from './create-line-item.dto';

export class CreatePurchaseOrderDto {
  @IsUUID()
  vendor_id: string;

  @IsString()
  purpose: string;

  @IsUUID()
  warehouse_id: string;

  @IsDateString()
  tentative_receipt_date: string;

  @IsOptional()
  @IsEnum(['En Proceso', 'Recibida', 'Cancelada'])
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  @ArrayMinSize(0)
  line_items?: CreateLineItemDto[];
}
