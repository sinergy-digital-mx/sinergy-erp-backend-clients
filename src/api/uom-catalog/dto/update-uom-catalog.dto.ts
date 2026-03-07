import { IsString, IsOptional } from 'class-validator';

export class UpdateUoMCatalogDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
