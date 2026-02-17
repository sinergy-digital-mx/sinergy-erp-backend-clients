import { IsString, IsOptional, IsNumber, Length } from 'class-validator';

export class UpdatePropertyGroupDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  location?: string;

  @IsOptional()
  @IsNumber()
  total_area?: number;
}
