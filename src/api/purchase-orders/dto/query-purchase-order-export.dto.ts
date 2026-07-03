import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryPurchaseOrderHeaderExportDto {
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
  @IsDateString()
  created_from?: string;

  @IsOptional()
  @IsDateString()
  created_to?: string;
}

export class QueryPurchaseOrderDetailExportDto extends QueryPurchaseOrderHeaderExportDto {
  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  declare created_from: string;

  @ApiProperty({ example: '2026-06-30' })
  @IsDateString()
  declare created_to: string;
}
