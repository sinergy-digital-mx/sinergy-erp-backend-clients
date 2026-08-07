import { IsNotEmpty, IsUUID, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductUoMDto {
  @ApiProperty({ example: 'uuid-uom-catalog', description: 'ID de la UoM del catálogo' })
  @IsNotEmpty()
  @IsUUID()
  uom_catalog_id: string;

  @ApiProperty({ example: 24, description: 'Factor de conversión (entero)' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  factor: number;

  @ApiProperty({ example: true, description: 'Es la unidad base del producto' })
  @IsNotEmpty()
  @IsBoolean()
  is_base: boolean;

  @ApiPropertyOptional({
    example: 'uuid-parent-uom',
    description:
      'UoM padre: preferible product_uoms.id de otra UoM del mismo producto; también acepta uom_catalog.id. En BD se guarda siempre como uom_catalog.id.',
  })
  @IsOptional()
  @IsUUID()
  parent_uom_id?: string | null;
}
