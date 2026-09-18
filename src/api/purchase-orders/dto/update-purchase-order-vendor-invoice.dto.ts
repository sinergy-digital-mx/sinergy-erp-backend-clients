import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePurchaseOrderVendorInvoiceDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Número de factura del proveedor. Enviar null o cadena vacía para borrar.',
    example: 'A-12345',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  vendor_invoice_number?: string | null;
}
