import { IsNotEmpty, IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUoMCatalogDto {
  @ApiProperty({ example: 'Pieza', description: 'Nombre de la unidad de medida' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({ example: 'Unidad individual', description: 'Descripción de la unidad' })
  @IsOptional()
  @IsString()
  description?: string;
}
