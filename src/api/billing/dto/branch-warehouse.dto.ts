import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsUUID,
  ValidateIf,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BranchWarehouseDto {
  @ApiPropertyOptional({ description: 'Warehouse ID (omit to create)' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ description: 'Warehouse name', example: 'Almacén Central' })
  @ValidateIf((dto: BranchWarehouseDto) => !dto.id)
  @IsNotEmpty()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Prefijo del almacén para el lote (ej. BDGA). Obligatorio antes de recibir OC',
    example: 'BDGA',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  prefix?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Calle. Obligatoria al guardar el almacén.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'La calle del almacén no puede pasar de 255 caracteres',
  })
  street?: string;

  @ApiPropertyOptional({
    description: 'Ciudad. Obligatoria al guardar el almacén.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'La ciudad del almacén no puede pasar de 255 caracteres',
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'Estado. Obligatorio al guardar el almacén.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'El estado del almacén no puede pasar de 255 caracteres',
  })
  state?: string;

  @ApiPropertyOptional({
    description: 'Código postal. Obligatorio al guardar el almacén.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, {
    message: 'El código postal del almacén no puede pasar de 20 caracteres',
  })
  zip_code?: string;

  @ApiPropertyOptional({
    description: 'País. Obligatorio al guardar el almacén.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'El país del almacén no puede pasar de 255 caracteres',
  })
  country?: string;

  @ApiPropertyOptional({
    description: 'Latitud GPS (Google Maps)',
    example: 32.5149,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La latitud del almacén no es un número válido' })
  @Min(-90, { message: 'La latitud del almacén debe estar entre -90 y 90' })
  @Max(90, { message: 'La latitud del almacén debe estar entre -90 y 90' })
  latitude?: number | null;

  @ApiPropertyOptional({
    description: 'Longitud GPS (Google Maps)',
    example: -117.0382,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La longitud del almacén no es un número válido' })
  @Min(-180, { message: 'La longitud del almacén debe estar entre -180 y 180' })
  @Max(180, { message: 'La longitud del almacén debe estar entre -180 y 180' })
  longitude?: number | null;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}
