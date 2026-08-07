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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description:
      'Prefijo de lotes al recibir OC (máx. 10). Obligatorio antes de recibir mercancía en este almacén. Formato: {prefix}-LOTE-000001',
    example: 'MZN',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zip_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Latitud GPS (Google Maps)',
    example: 32.5149,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @ApiPropertyOptional({
    description: 'Longitud GPS (Google Maps)',
    example: -117.0382,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}
