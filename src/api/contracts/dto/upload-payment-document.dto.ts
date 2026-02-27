import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class UploadPaymentDocumentDto {
  @IsNotEmpty()
  @IsEnum(['comprobante_transferencia', 'foto_deposito', 'recibo', 'factura', 'otro'])
  document_type: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
