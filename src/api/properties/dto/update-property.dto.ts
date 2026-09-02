import { IsString, IsNumber, IsOptional, Length, IsEnum, IsIn, MaxLength } from 'class-validator';

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  block?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  lot_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cadastral_key?: string;

  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  /** UUID de grupo de cliente (`GET /tenant/customers/groups`). */
  @IsOptional()
  @IsString()
  group_id?: string;

  @IsOptional()
  @IsNumber()
  total_area?: number;

  @IsOptional()
  @IsString()
  measurement_unit_id?: string;

  @IsOptional()
  @IsNumber()
  total_price?: number;

  @IsOptional()
  @IsNumber()
  price_per_m2?: number;

  @IsOptional()
  @IsNumber()
  list_price?: number;

  @IsOptional()
  @IsIn(['USD', 'MXN'])
  currency?: 'USD' | 'MXN';

  @IsOptional()
  @IsEnum(['disponible', 'vendido', 'reservado', 'cancelado'])
  status?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
