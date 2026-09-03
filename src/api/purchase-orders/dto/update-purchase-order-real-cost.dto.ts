import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class PurchaseOrderExtraCostDto {
  @IsString()
  @MaxLength(120)
  concept: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsEnum(['MXN', 'USD'])
  currency: 'MXN' | 'USD';
}

export class PurchaseOrderRealCostLineIgiDto {
  @IsUUID()
  line_item_id: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  igi_percentage: number;
}

/**
 * Reemplaza el tab de costo real. extra_costs es la lista completa (agregar / quitar filas).
 * Vacío + T.C. null limpia el costo real.
 */
export class UpdatePurchaseOrderRealCostDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? null : value))
  @IsDateString()
  customs_date?: string | null;

  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? null : Number(value),
  )
  @ValidateIf((_, value) => value != null)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  customs_exchange_rate?: number | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(80)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderExtraCostDto)
  extra_costs?: PurchaseOrderExtraCostDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderRealCostLineIgiDto)
  line_items?: PurchaseOrderRealCostLineIgiDto[];
}
