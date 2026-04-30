import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateProductAttributeDto {
  @ApiProperty({ example: 'Calidad', description: 'Nombre del atributo de producto' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({ example: true, description: 'Estado activo del atributo' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
