import { IsNumber, Min, Max, IsOptional, IsUUID } from 'class-validator';

export class UpdateLineItemDto {
  /** Quantity in the selected UOM (same rules as create). */
  @IsNumber()
  @Min(0.001)
  @IsOptional()
  quantity?: number;

  /**
   * Product UOM row id or UoM catalog id for this line's product
   * (resolved via UnitConversionService.getProductUomId).
   */
  @IsUUID()
  @IsOptional()
  uom_id?: string;

  /** Costo unitario sin impuestos. Hasta 4 decimales (p. ej. 2.215). */
  @IsNumber()
  @Min(0)
  @IsOptional()
  unit_total?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  iva_percentage?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  ieps_percentage?: number;
}
