import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

/** Contexto para abrir el modal de transferencia (vista totalizada o desde lote) */
export class TransferContextQueryDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  warehouse_id: string;

  @ApiPropertyOptional({ description: 'Filtra los lotes de esa unidad de medida' })
  @IsOptional()
  @IsUUID()
  uom_id?: string;
}
