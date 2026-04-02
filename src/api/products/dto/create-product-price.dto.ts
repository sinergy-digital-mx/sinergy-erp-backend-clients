import { IsNotEmpty, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductPriceDto {
  @ApiProperty({ example: 'uuid-price-list', description: 'ID de la lista de precios' })
  @IsNotEmpty()
  @IsUUID()
  price_list_id: string;

  @ApiProperty({ example: 'uuid-product-uom', description: 'ID de la UOM del producto' })
  @IsNotEmpty()
  @IsUUID()
  product_uom_id: string;

  @ApiProperty({ example: 100.50, description: 'Precio base del producto' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

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
}
