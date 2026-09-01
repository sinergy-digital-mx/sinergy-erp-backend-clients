import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryVendorCostImportDto {
  @ApiProperty({ description: 'ID del proveedor' })
  @IsUUID()
  vendor_id: string;
}
