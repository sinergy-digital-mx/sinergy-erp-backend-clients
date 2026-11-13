import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateWarehouseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  /** Prefijo de almacén para lotes: `{razon}-{sucursal}-{almacen}-{numero}` */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  prefix?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'La calle del almacén no puede pasar de 255 caracteres',
  })
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'La ciudad del almacén no puede pasar de 255 caracteres',
  })
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'El estado del almacén no puede pasar de 255 caracteres',
  })
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, {
    message: 'El código postal del almacén no puede pasar de 20 caracteres',
  })
  zip_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'El país del almacén no puede pasar de 255 caracteres',
  })
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La latitud del almacén no es un número válido' })
  @Min(-90, { message: 'La latitud del almacén debe estar entre -90 y 90' })
  @Max(90, { message: 'La latitud del almacén debe estar entre -90 y 90' })
  latitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La longitud del almacén no es un número válido' })
  @Min(-180, { message: 'La longitud del almacén debe estar entre -180 y 180' })
  @Max(180, { message: 'La longitud del almacén debe estar entre -180 y 180' })
  longitude?: number | null;

  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
