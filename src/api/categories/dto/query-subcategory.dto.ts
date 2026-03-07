import { IsOptional, IsString, IsNumber, IsUUID } from 'class-validator';

export class QuerySubcategoryDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;
}
