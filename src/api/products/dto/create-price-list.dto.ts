import {
  IsNotEmpty,
  IsString,
  IsOptional,
  Length,
  IsInt,
  IsNumber,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

function optionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).trim().replace(',', '.'));
  return parsed;
}

export class CreatePriceListDto {
  @ApiProperty({ example: 'Precio Comercial', description: 'Nombre de la lista de precios' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({ example: 1, description: 'Número libre de la lista. No tiene que ir en orden.', nullable: true })
  @IsOptional()
  @Transform(({ value }) => optionalNumber(value))
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(1)
  @Max(9999)
  list_number?: number | null;

  @ApiPropertyOptional({ example: 18, description: 'Porcentaje de margen sobre el costo promedio.', nullable: true })
  @IsOptional()
  @Transform(({ value }) => optionalNumber(value))
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(-100)
  @Max(999.99)
  margin_percent?: number | null;

  @ApiPropertyOptional({ example: 'Precios para clientes comerciales', description: 'Descripción' })
  @IsOptional()
  @IsString()
  description?: string;
}
