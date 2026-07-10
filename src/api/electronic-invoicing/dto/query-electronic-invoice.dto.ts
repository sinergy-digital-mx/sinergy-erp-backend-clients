import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryElectronicInvoiceDto {
  @IsOptional()
  @IsEnum(['sales_orders'])
  source_module?: 'sales_orders';

  @IsOptional()
  @IsUUID()
  source_id?: string;

  @IsOptional()
  @IsString()
  stamp_status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
