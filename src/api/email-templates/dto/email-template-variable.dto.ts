import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class EmailTemplateCustomVariableDto {
  @ApiProperty({ example: 'accountManagerName' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z][a-zA-Z0-9_.-]*$/)
  key: string;

  @ApiProperty({ example: 'Nombre del asesor' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 150)
  label: string;

  @ApiProperty({ example: 'string', enum: ['string', 'number', 'date', 'currency', 'boolean'] })
  @IsIn(['string', 'number', 'date', 'currency', 'boolean'])
  type: 'string' | 'number' | 'date' | 'currency' | 'boolean';

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ example: 'Juan Perez' })
  @IsOptional()
  defaultValue?: string | number | boolean | null;
}

export class AvailableEmailTemplateVariableDto {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'boolean';
  source: string;
  description?: string;
}

export class AvailableEmailTemplateEntityDto {
  entity: string;
  label: string;
  moduleCode: string;
  variables: AvailableEmailTemplateVariableDto[];
}
