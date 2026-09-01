import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateInventoryAuditLineDto {
  @ApiProperty({ description: 'ID de la línea de auditoría' })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Cantidad física contada. 0 es válido (lote vacío).',
    example: 12.5,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  counted_quantity: number;

  @ApiPropertyOptional({
    description: 'Motivo obligatorio si hay diferencia vs el sistema',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateInventoryAuditLinesDto {
  @ApiProperty({ type: [UpdateInventoryAuditLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateInventoryAuditLineDto)
  lines: UpdateInventoryAuditLineDto[];
}
