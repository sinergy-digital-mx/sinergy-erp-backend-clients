import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdatePurchaseOrderVendorInvoiceDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Número de factura del proveedor (compatibilidad). Enviar null o cadena vacía para borrar si no mandas el arreglo.',
    example: 'A-12345',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  vendor_invoice_number?: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Facturas de proveedor. Reemplaza la lista completa. [] o null borra todas.',
    example: ['A-12345', 'B-67890'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  vendor_invoice_numbers?: string[] | null;
}
