import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CancelElectronicInvoiceDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^0[1-4]$/, { message: 'motivo debe ser 01, 02, 03 o 04' })
  motivo: string;

  @IsOptional()
  @IsString()
  folio_sustitucion?: string;
}
