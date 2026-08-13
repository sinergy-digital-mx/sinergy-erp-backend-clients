import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InventoryStatsFilterDto {
  @ApiProperty({
    description: 'Filtrar por razón social. Requerido si se envía billing_branch_id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  fiscal_configuration_id?: string;

  @ApiProperty({
    description: 'Filtrar por sucursal. Requiere fiscal_configuration_id. Requerido si se envía warehouse_id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @ApiProperty({
    description: 'Filtrar por almacén. Requiere fiscal_configuration_id y billing_branch_id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  warehouse_id?: string;
}
