import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsInt,
  IsEmail,
  IsEnum,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDivinoReservationFormatDto {
  // --- LOTE (obligatorio, seleccionado del sistema) ---
  @IsUUID()
  property_id: string;

  // --- Encabezado / Razón social ---
  @IsOptional()
  @IsUUID()
  fiscal_configuration_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  payable_to?: string;

  // --- Recepción de fondos ---
  @IsOptional()
  @IsString()
  @MaxLength(255)
  received_from?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  amount_in_words?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  evidenced_by?: string;

  // --- LOTE snapshots (opcionales, se derivan del property si no se envían) ---
  @IsOptional()
  @IsString()
  @MaxLength(50)
  block?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lot_number?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  surface?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchase_price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  // --- Plan de pagos ---
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reservation_deposit?: number;

  @IsOptional()
  @IsDateString()
  reservation_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  down_payment?: number;

  @IsOptional()
  @IsDateString()
  down_payment_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  financed_balance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  financing_years?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  monthly_payments_count?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthly_payment_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maintenance_fee?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  maintenance_currency?: string;

  @IsOptional()
  @IsEnum(['1', '15'])
  payment_day?: string;

  // --- Datos del comprador ---
  @IsOptional()
  @IsString()
  @MaxLength(255)
  buyer_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  buyer_address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  buyer_phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  buyer_email?: string;

  // --- Cómo se enteró del proyecto ---
  @IsOptional()
  @IsEnum([
    'facebook',
    'instagram',
    'google',
    'restaurante',
    'walkin',
    'referido',
    'otro',
  ])
  lead_source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lead_source_other?: string;

  // --- Pie del formato ---
  @IsOptional()
  @IsDateString()
  format_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  agent_name?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
