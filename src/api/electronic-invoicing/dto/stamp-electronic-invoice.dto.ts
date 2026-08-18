import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class StampElectronicInvoiceDto {
  @IsUUID()
  fiscal_configuration_id: string;

  @IsEnum(['sales_orders'])
  source_module: 'sales_orders';

  @IsUUID()
  source_id: string;

  @IsNotEmpty()
  @IsString()
  xml: string;

  @IsNotEmpty()
  @IsString()
  rfc_receptor: string;

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsNumber()
  @Min(0)
  total: number;

  @IsOptional()
  @IsString()
  receptor_nombre?: string;

  @IsOptional()
  @IsString()
  series?: string;

  @IsOptional()
  @IsString()
  folio?: string;

  @IsOptional()
  @IsString()
  tipo_comprobante?: string;

  @IsOptional()
  @IsString()
  rfc_emisor?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  certificate_serial?: string;

  /** Override por factura. Si se omite, usa el ambiente activo de Finkok (`stamping_environment`). */
  @IsOptional()
  @IsEnum(['demo', 'production'])
  environment?: 'demo' | 'production';

  @IsOptional()
  metadata?: Record<string, unknown>;
}
