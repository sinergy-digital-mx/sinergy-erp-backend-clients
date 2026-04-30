import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateProductAttributeValueDto {
  @ApiProperty({ example: 'FAS', description: 'Valor del atributo' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  value: string;

  @ApiPropertyOptional({ example: 1, description: 'Orden de visualización' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  display_order?: number;

  @ApiPropertyOptional({ example: true, description: 'Estado activo del valor' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
