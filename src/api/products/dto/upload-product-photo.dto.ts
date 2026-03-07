import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadProductPhotoDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  alt_text?: string;
}
