import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryElectronicInvoiceDto {
  @IsOptional()
  @IsEnum(['sales_orders', 'quotations', 'global_invoices'])
  source_module?: 'sales_orders' | 'quotations' | 'global_invoices';

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
