import { IsOptional, IsUUID, IsEnum, IsDateString, Type, Min, Max } from 'class-validator';

export class QueryPurchaseOrderDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  @IsOptional()
  @IsEnum(['En Proceso', 'Recibida', 'Cancelada'])
  status?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}
