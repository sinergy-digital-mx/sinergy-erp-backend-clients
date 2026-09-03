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

const GENERAL_STATUS_VALUES = ['Creada', 'Convertida', 'Cancelada'] as const;

function parseGeneralStatuses(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parts = (Array.isArray(value) ? value : String(value).split(','))
    .map((v) => String(v).trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

export class QueryQuotationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseGeneralStatuses(value))
  @IsEnum(GENERAL_STATUS_VALUES, { each: true })
  general_status?: string[];

  @IsOptional()
  @IsEnum(['POS', 'MANUAL'])
  quotation_type?: 'POS' | 'MANUAL';

  @IsOptional()
  @IsUUID()
  fiscal_configuration_id?: string;

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
