import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPurchaseOrderDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['Creada', 'Recibida', 'Cancelada'])
  general_status?: string;

  @IsOptional()
  @IsEnum(['Pendiente', 'Pagado'])
  payment_status?: string;

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
