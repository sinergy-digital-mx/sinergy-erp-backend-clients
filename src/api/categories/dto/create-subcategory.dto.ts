import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateSubcategoryDto {
  @IsNotEmpty()
  @IsUUID()
  category_id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

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
