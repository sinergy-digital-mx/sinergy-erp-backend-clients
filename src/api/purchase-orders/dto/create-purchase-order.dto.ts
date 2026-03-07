import { IsUUID, IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';

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
}
