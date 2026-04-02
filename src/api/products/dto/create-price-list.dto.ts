import { IsNotEmpty, IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePriceListDto {
  @ApiProperty({ example: 'Precio Comercial', description: 'Nombre de la lista de precios' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({ example: 'Precios para clientes comerciales', description: 'Descripción' })
  @IsOptional()
  @IsString()
  description?: string;
}
