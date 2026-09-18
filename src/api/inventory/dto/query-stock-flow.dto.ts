import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export enum StockFlowPeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  RANGE = 'range',
}

export enum StockFlowView {
  SUMMARY = 'summary',
  LEDGER = 'ledger',
  /** Totales por sucursal (todas las de la razón social). */
  TOTALIZED = 'totalized',
}

export class QueryStockFlowDto {
  @ApiProperty({ enum: StockFlowPeriod, default: StockFlowPeriod.MONTH })
  @IsEnum(StockFlowPeriod)
  period: StockFlowPeriod = StockFlowPeriod.MONTH;

  @ApiPropertyOptional({ description: 'Requerido si period=range (ISO o YYYY-MM-DD)' })
  @ValidateIf((o) => o.period === StockFlowPeriod.RANGE)
  @IsString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Requerido si period=range' })
  @ValidateIf((o) => o.period === StockFlowPeriod.RANGE)
  @IsString()
  date_to?: string;

  @ApiProperty({ enum: StockFlowView, default: StockFlowView.SUMMARY })
  @IsEnum(StockFlowView)
  @IsOptional()
  view?: StockFlowView = StockFlowView.SUMMARY;

  @ApiProperty({ description: 'Razón social (obligatoria)' })
  @IsUUID()
  fiscal_configuration_id: string;

  @ApiPropertyOptional({
    description: 'Sucursal opcional. En totalizado, omitir = todas las de la razón social',
  })
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @ApiPropertyOptional({
    description:
      'Proveedor opcional. Limita a productos con costo/catálogo de ese proveedor o lotes recibidos de sus OC',
  })
  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  product_id?: string;

  @ApiPropertyOptional({ description: 'Búsqueda por SKU o nombre de producto' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ description: 'Página (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Filas por página (máx. 100). Excel ignora la paginación.',
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
