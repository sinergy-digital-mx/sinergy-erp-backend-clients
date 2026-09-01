import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

function emptyToUndefined({ value }: { value: unknown }) {
  if (value === '' || value === null) {
    return undefined;
  }
  return value;
}

/**
 * Edición de tag y medida del lote.
 * El almacén no va aquí: se mueve con transferencia.
 */
export class UpdateInventoryBatchDto {
  @ApiPropertyOptional({
    nullable: true,
    description: 'TAG del lote. Cadena vacía o null para borrar.',
    example: '648664',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source_tag_identifier?: string | null;

  @ApiPropertyOptional({
    description:
      'Tamaño (8, 12). Solo si el lote no tiene medida. Independiente de la UOM de inventario.',
    example: 8,
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  @Max(999999.999)
  measure?: number;

  @ApiPropertyOptional({
    description: 'Unidad del tamaño (Foot, PIES). Del catálogo UoM; no uses la UOM del producto.',
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  measure_uom_id?: string;
}
