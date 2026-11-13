import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateSalesOrderLineItemDto {
  @ApiPropertyOptional({ description: 'Cantidad en la UOM de la línea' })
  @IsNumber()
  @Min(0.001)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'ID de product_uoms o de uom_catalog de la línea',
  })
  @IsUUID()
  @IsOptional()
  product_uom_id?: string;

  @ApiPropertyOptional({
    description: 'Precio unitario sin impuestos. Hasta 4 decimales.',
    example: 2.15,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unit_price?: number;

  @ApiPropertyOptional({ description: 'Descuento % de línea (si no hay product_discount_id)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discount_percentage?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  iva_percentage?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  ieps_percentage?: number;

  @ApiPropertyOptional({
    description: 'Nota de la línea. null o vacío la borra.',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
