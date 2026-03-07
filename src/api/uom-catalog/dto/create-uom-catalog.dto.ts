import { IsString, IsOptional } from 'class-validator';

export class CreateUoMCatalogDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
