import { IsOptional, IsString, Matches, ValidateIf, MaxLength, IsBoolean, IsInt, Min, Max, IsIn } from 'class-validator';
import { MEXICO_TIME_ZONE_IDS } from '../../accounting/utils/public-invoice-policy.util';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateFiscalConfigurationDto {
  @IsOptional()
  @IsString()
  razon_social?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, {
    message: 'El RFC no tiene un formato válido (3-4 letras + 6 dígitos + 3 alfanuméricos)',
  })
  rfc?: string;

  @IsOptional()
  @IsString()
  persona_type?: string;

  @ApiPropertyOptional({
    description: 'Prefijo para lotes de recepción (ej. MZN). Letras/números, máx. 10, sin guiones',
    example: 'MZN',
    maxLength: 10,
    nullable: true,
  })
  @Transform(({ value }) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value === '') {
      return null;
    }
    return String(value);
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @MaxLength(10)
  prefix?: string | null;

  @IsOptional()
  @IsString()
  fiscal_regime?: string;

  @IsOptional()
  @IsString()
  digital_seal?: string;

  @IsOptional()
  @IsString()
  digital_seal_password?: string;

  @IsOptional()
  @IsString()
  private_key?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Usa el logo de esta razón social como marca del menú. Solo una puede estar activa.',
  })
  @Transform(({ value }) => {
    if (value === undefined)
      return undefined;
    return value === true || value === 'true' || value === 1 || value === '1';
  })
  @IsOptional()
  @IsBoolean()
  use_as_system_logo?: boolean;

  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Días de vigencia de cotizaciones. Vacío = no se cancelan solas. El proceso diario cancela las Creada al cumplir esos días.',
    example: 15,
    minimum: 1,
    maximum: 3650,
    nullable: true,
  })
  @Transform(({ value }) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value === '') {
      return null;
    }
    const days = Number(value);
    if (!Number.isFinite(days) || days <= 0) {
      return null;
    }
    return Math.trunc(days);
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(1)
  @Max(3650)
  quotation_expiration_days?: number | null;

  @ApiPropertyOptional({
    description: 'Permite factura de anticipo en cotizaciones y órdenes de esta razón social.',
  })
  @Transform(({ value }) => {
    if (value === undefined)
      return undefined;
    return value === true || value === 'true' || value === 1 || value === '1';
  })
  @IsOptional()
  @IsBoolean()
  advance_invoicing_enabled?: boolean;

  @ApiPropertyOptional({ description: 'IVA en compras, ventas y cotizaciones de esta razón social.' })
  @Transform(({ value }) => {
    if (value === undefined)
      return undefined;
    return value === true || value === 'true' || value === 1 || value === '1';
  })
  @IsOptional()
  @IsBoolean()
  iva_enabled?: boolean;

  @ApiPropertyOptional({ description: 'IEPS en producto, compras, ventas, cotizaciones, PDF y factura de esta razón social.' })
  @Transform(({ value }) => {
    if (value === undefined)
      return undefined;
    return value === true || value === 'true' || value === 1 || value === '1';
  })
  @IsOptional()
  @IsBoolean()
  ieps_enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Permite transferir inventario de esta razón social hacia otra.',
  })
  @Transform(({ value }) => {
    if (value === undefined)
      return undefined;
    return value === true || value === 'true' || value === 1 || value === '1';
  })
  @IsOptional()
  @IsBoolean()
  multi_fiscal_transfers_enabled?: boolean;

  @ApiPropertyOptional({
    description: 'El último día del mes, a la hora indicada, timbra la factura a público en general con las órdenes que el cliente no facturó.',
  })
  @Transform(({ value }) => {
    if (value === undefined)
      return undefined;
    return value === true || value === 'true' || value === 1 || value === '1';
  })
  @IsOptional()
  @IsBoolean()
  global_invoice_auto_enabled?: boolean;

  @ApiPropertyOptional({
    description: 'No permite facturar la orden por separado después de la hora de cierre del mes de la orden.',
  })
  @Transform(({ value }) => {
    if (value === undefined)
      return undefined;
    return value === true || value === 'true' || value === 1 || value === '1';
  })
  @IsOptional()
  @IsBoolean()
  global_invoice_block_after_month?: boolean;

  @ApiPropertyOptional({
    description: 'Hora en punto del cierre (0–23), en la zona horaria de la razón social.',
    minimum: 0,
    maximum: 23,
    nullable: true,
  })
  @Transform(({ value }) => {
    if (value === undefined)
      return undefined;
    if (value === null || value === '')
      return null;
    const hour = Number(value);
    return Number.isFinite(hour) ? Math.trunc(hour) : value;
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(0)
  @Max(23)
  global_invoice_hour?: number | null;

  @ApiPropertyOptional({
    description: 'Zona horaria IANA de México para el mes de la orden y la hora de cierre.',
    example: 'America/Tijuana',
    nullable: true,
  })
  @Transform(({ value }) => {
    if (value === undefined)
      return undefined;
    if (value === null || value === '')
      return null;
    return String(value);
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @IsIn(MEXICO_TIME_ZONE_IDS)
  global_invoice_timezone?: string | null;
}
