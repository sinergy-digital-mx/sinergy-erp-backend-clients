import { IsNotEmpty, IsUUID, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductVendorCostDto {
  @ApiProperty({ example: 'uuid-vendor', description: 'ID del proveedor' })
  @IsNotEmpty()
  @IsUUID()
  vendor_id: string;

  @ApiProperty({ example: 'uuid-product-uom', description: 'ID de la UOM del producto' })
  @IsNotEmpty()
  @IsUUID()
  product_uom_id: string;

  @ApiProperty({ example: 2.215, description: 'Costo unitario sin impuestos. Hasta 4 decimales.' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiProperty({ example: 16, description: 'Porcentaje de IVA' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  iva_percentage: number;

  @ApiProperty({ example: 0, description: 'Porcentaje de IEPS' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ieps_percentage: number;

  @ApiProperty({
    enum: ['MXN', 'USD'],
    default: 'MXN',
    required: false,
    description: 'Moneda del costo. MXN = pesos, USD = dólares. Default MXN.',
  })
  @IsOptional()
  @IsEnum(['MXN', 'USD'])
  currency?: 'MXN' | 'USD';
}
