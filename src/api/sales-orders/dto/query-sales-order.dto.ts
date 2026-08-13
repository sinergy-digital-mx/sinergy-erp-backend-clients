import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

const GENERAL_STATUS_VALUES = [
  'Creada',
  'En Selección',
  'Lista para entrega',
  'Surtida',
  'Cancelada',
  'En cola',
  'En Camino',
] as const;

/** Acepta un status, varios (`?general_status=A&general_status=B`) o CSV. Siempre normaliza a array. */
function parseGeneralStatuses(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parts = (Array.isArray(value) ? value : String(value).split(','))
    .map((v) => String(v).trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

export class QuerySalesOrderDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseGeneralStatuses(value))
  @IsEnum(GENERAL_STATUS_VALUES, { each: true })
  general_status?: string[];

  @IsOptional()
  @IsEnum(['Pendiente', 'Pagado'])
  payment_status?: string;

  @IsOptional()
  @IsEnum(['POS', 'MANUAL'])
  sales_order_type?: 'POS' | 'MANUAL';

  /** Razón social (config fiscal). Omitir o null = todas. */
  @IsOptional()
  @IsUUID()
  fiscal_configuration_id?: string;

  /** Sucursal. Omitir o null = todas las sucursales. */
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @IsOptional()
  @IsNumber()
  customer_id?: number;

  @IsOptional()
  @IsDateString()
  created_from?: string;

  @IsOptional()
  @IsDateString()
  created_to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['created_at', 'folio', 'total'])
  sort_by?: string = 'created_at';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}
