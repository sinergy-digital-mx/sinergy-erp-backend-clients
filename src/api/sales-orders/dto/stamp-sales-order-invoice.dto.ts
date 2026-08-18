import { IsEnum, IsOptional, IsString } from 'class-validator';

export class StampSalesOrderInvoiceDto {
  /** XML CFDI 4.0 sin sellar. Obligatorio hasta implementar generador automático. */
  @IsOptional()
  @IsString()
  xml?: string;

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
  certificate_serial?: string;

  /** Override por factura: `demo` o `production`. Si se omite, usa el ambiente activo de Finkok. */
  @IsOptional()
  @IsEnum(['demo', 'production'])
  environment?: 'demo' | 'production';
}
