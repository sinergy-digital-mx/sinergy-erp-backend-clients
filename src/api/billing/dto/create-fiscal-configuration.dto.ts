import { IsNotEmpty, IsString, IsOptional, Matches, MaxLength, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateFiscalConfigurationDto {
  @IsNotEmpty()
  @IsString()
  razon_social: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, {
    message: 'El RFC no tiene un formato válido (3-4 letras + 6 dígitos + 3 alfanuméricos)',
  })
  rfc: string;

  @IsNotEmpty()
  @IsString()
  persona_type: string;

  @ApiPropertyOptional({
    description: 'Prefijo para lotes de recepción (ej. MZN). Letras/números, máx. 10, sin guiones',
    example: 'MZN',
    maxLength: 10,
    nullable: true,
  })
  @Transform(({ value }) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value === '') {
      return null;
    }
    return String(value);
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @MaxLength(10)
  prefix?: string | null;

  @IsOptional()
  @IsString()
  fiscal_regime?: string;

  @IsOptional()
  @IsString()
  digital_seal?: string;

  @IsOptional()
  @IsString()
  digital_seal_password?: string;

  @IsOptional()
  @IsString()
  private_key?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
