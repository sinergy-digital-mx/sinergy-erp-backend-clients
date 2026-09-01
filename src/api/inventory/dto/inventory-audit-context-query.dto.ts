import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class InventoryAuditContextQueryDto {
  @ApiProperty({ description: 'Almacén a auditar' })
  @IsUUID()
  warehouse_id: string;

  @ApiPropertyOptional({ description: 'Filtrar lotes de un producto' })
  @IsOptional()
  @IsUUID()
  product_id?: string;
}
