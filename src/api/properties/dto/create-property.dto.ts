import { IsString, IsNumber, IsOptional, Length, IsEnum } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @Length(1, 50)
  code: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  block?: string;

  @IsString()
  @Length(1, 150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsString()
  group_id: string;

  @IsNumber()
  total_area: number;

  @IsString()
  measurement_unit_id: string;

  @IsNumber()
  total_price: number;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  currency?: string;

  @IsOptional()
  @IsEnum(['disponible', 'vendido', 'reservado', 'cancelado'])
  status?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
