import { IsNotEmpty, IsString, IsOptional, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'PROD-001', description: 'SKU único del producto' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  sku: string;

  @ApiPropertyOptional({
    example: 'EXT-ERP-001',
    description: 'SKU externo del producto en sistemas de terceros',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  external_sku?: string;

  @ApiProperty({ example: 'Producto de ejemplo', description: 'Nombre del producto' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({ example: 'Descripción detallada del producto', description: 'Descripción' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '31201610', description: 'Clave de producto o servicio SAT (c_ClaveProdServ)' })
  @IsOptional()
  @IsString()
  @Length(1, 8)
  sat_clave?: string;

  @ApiPropertyOptional({ example: 'uuid-category', description: 'ID de la categoría' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ example: 'uuid-subcategory', description: 'ID de la subcategoría' })
  @IsOptional()
  @IsUUID()
  subcategory_id?: string;
}
