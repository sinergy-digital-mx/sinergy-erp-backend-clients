import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImportMadereriaInventoryDto {
  @ApiProperty({ description: 'ID de la razón social' })
  @IsUUID()
  fiscal_configuration_id: string;

  @ApiProperty({ description: 'ID de la sucursal' })
  @IsUUID()
  billing_branch_id: string;

  @ApiProperty({ description: 'ID del almacén destino' })
  @IsUUID()
  warehouse_id: string;
}
