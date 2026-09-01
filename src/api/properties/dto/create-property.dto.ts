import { IsString, IsNumber, IsOptional, Length, IsEnum, MaxLength } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @Length(1, 50)
  code: string;

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

  @IsString()
  @Length(1, 150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  /** UUID de grupo de cliente (`GET /tenant/customers/groups`). No usar property-groups. */
  @IsString()
  group_id: string;

  @IsNumber()
  total_area: number;

  @IsString()
  measurement_unit_id: string;

  @IsOptional()
  @IsNumber()
  total_price?: number;

  /** Si se envía, el backend calcula total_price = total_area × price_per_m2. */
  @IsOptional()
  @IsNumber()
  price_per_m2?: number;

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
