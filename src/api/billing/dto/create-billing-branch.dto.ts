import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsArray,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BranchWarehouseDto } from './branch-warehouse.dto';


export class CreateBillingBranchDto {
  @ApiProperty({
    description: 'Nombre de la sucursal (lo que se muestra en UI)',
    example: 'Sucursal Buenos Aires',
  })
  @ValidateIf((dto: CreateBillingBranchDto) => !dto.code)
  @IsNotEmpty({ message: 'El nombre de la sucursal es obligatorio' })
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Alias legado de name. La UI nueva debe enviar name, no code.',
    example: 'Sucursal Buenos Aires',
  })
  @ValidateIf((dto: CreateBillingBranchDto) => !dto.name)
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Prefijo para lotes de recepción (ej. SBA). Letras/números, máx. 10, sin guiones',
    example: 'SBA',
    maxLength: 10,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  prefix?: string | null;

  @ApiProperty({ description: 'Street address', example: 'Av. Principal 123' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'City', example: 'Monterrey' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ description: 'State', example: 'Nuevo León' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ description: 'Country', example: 'México' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ description: 'Postal code', example: '64000' })
  @IsNotEmpty()
  @IsString()
  postal_code: string;

  @ApiProperty({
    description: 'Teléfono de contacto de la sucursal',
    example: '6641234567',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  phone?: string | null;

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

  @ApiProperty({ description: 'Status: 1 = active, 0 = inactive', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  status?: number;

  @ApiPropertyOptional({
    description: 'Almacenes vinculados a la sucursal',
    type: [BranchWarehouseDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BranchWarehouseDto)
  warehouses?: BranchWarehouseDto[];
}
