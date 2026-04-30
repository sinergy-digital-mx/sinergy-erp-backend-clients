import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class QuerySalesOrderDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['Creada', 'Surtida', 'Cancelada'])
  general_status?: string;

  @IsOptional()
  @IsEnum(['Pendiente', 'Pagado'])
  payment_status?: string;

  @IsOptional()
  @IsEnum(['POS', 'MANUAL'])
  sales_order_type?: 'POS' | 'MANUAL';

  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @IsOptional()
  @IsNumber()
  customer_id?: number;

  @IsOptional()
  @IsDateString()
  created_from?: string;

  @IsOptional()
  @IsDateString()
  created_to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['created_at', 'folio', 'total'])
  sort_by?: string = 'created_at';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}
