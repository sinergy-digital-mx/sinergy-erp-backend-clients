import { IsOptional, IsString, IsNumber, IsBoolean, MaxLength } from 'class-validator';

export class UpdateProductPhotoDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  alt_text?: string;

  @IsOptional()
  @IsNumber()
  display_order?: number;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}
