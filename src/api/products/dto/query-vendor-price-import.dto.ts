import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryVendorPriceImportDto {
  @ApiProperty({ description: 'ID del proveedor' })
  @IsUUID()
  vendor_id: string;

  @ApiProperty({ description: 'ID de la lista de precios a actualizar' })
  @IsUUID()
  price_list_id: string;
}
