import { IsUUID, IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @IsOptional()
  @IsDateString()
  tentative_receipt_date?: string;

  @IsOptional()
  @IsEnum(['En Proceso', 'Recibida', 'Cancelada'])
  status?: string;
}
