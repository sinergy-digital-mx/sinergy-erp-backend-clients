import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreateTruckDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  placa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  anio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  permiso_sct?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  numero_permiso_sct?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tipo_auto_transporte?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  aseguradora_rc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  poliza_rc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subtipo_remolque1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  placa_remolque1?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;
}
