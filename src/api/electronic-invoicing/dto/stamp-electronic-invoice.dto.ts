import {
  IsEnum,
  IsIn,
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

  @IsEnum(['sales_orders', 'quotations', 'global_invoices'])
  source_module: 'sales_orders' | 'quotations' | 'global_invoices';

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

  @IsOptional()
  @IsIn(['standard', 'advance', 'merchandise', 'advance_application', 'credit_note'])
  invoice_role?: 'standard' | 'advance' | 'merchandise' | 'advance_application' | 'credit_note';

  @IsOptional()
  @IsUUID()
  related_advance_invoice_id?: string;

  @IsOptional()
  @IsUUID()
  related_invoice_id?: string;

  @IsOptional()
  @IsString()
  relation_type?: string;
}
