import { IsNotEmpty, IsString, IsOptional, IsUUID, Length, IsEnum, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductItemKind } from '../../../entities/products/product-item-kind.enum';

export class CreateProductDto {
  @ApiProperty({ example: 'PROD-001', description: 'SKU único. En servicio se puede omitir y se genera.' })
  @ValidateIf((dto: CreateProductDto) => dto.item_kind !== ProductItemKind.Service || !!dto.sku)
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  sku?: string;

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

  /** Alias de `sat_clave`. El modal de producto usa `sat_code`. */
  @ApiPropertyOptional({ example: '31201610', description: 'Alias de sat_clave' })
  @IsOptional()
  @IsString()
  @Length(1, 8)
  sat_code?: string;

  @ApiPropertyOptional({ example: 'uuid-category', description: 'ID de la categoría' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ example: 'uuid-subcategory', description: 'ID de la subcategoría' })
  @IsOptional()
  @IsUUID()
  subcategory_id?: string;

  @ApiPropertyOptional({ enum: ProductItemKind, default: ProductItemKind.Goods })
  @IsOptional()
  @IsEnum(ProductItemKind)
  item_kind?: ProductItemKind;

  @ApiPropertyOptional({
    example: 'uuid-uom-catalog',
    description: 'UOM base del catálogo. Si se envía, se crea en la misma transacción.',
  })
  @IsOptional()
  @IsUUID()
  base_uom_catalog_id?: string;

  /** Alias de `base_uom_catalog_id` (modal de producto). */
  @ApiPropertyOptional({ example: 'uuid-uom-catalog' })
  @IsOptional()
  @IsUUID()
  base_uom_id?: string;
}
