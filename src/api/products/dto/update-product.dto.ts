import { IsString, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateIf((o) => o.category_id !== '' && o.category_id !== null)
  @IsUUID('4', { message: 'category_id must be a valid UUID' })
  @IsOptional()
  category_id?: string | null;

  @ValidateIf((o) => o.subcategory_id !== '' && o.subcategory_id !== null)
  @IsUUID('4', { message: 'subcategory_id must be a valid UUID' })
  @IsOptional()
  subcategory_id?: string | null;

  @ValidateIf((o) => o.base_uom_id !== '' && o.base_uom_id !== null)
  @IsUUID('4', { message: 'base_uom_id must be a valid UUID' })
  @IsOptional()
  base_uom_id?: string | null;
}
