import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateSubcategoryDto {
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  display_order?: number;
}
