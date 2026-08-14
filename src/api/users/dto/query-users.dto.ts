import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class QueryUsersDto {
  @ApiPropertyOptional({
    description: 'Buscar por email, nombre o apellido',
    example: 'ariana',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estatus. Si se omite, se excluyen usuarios eliminados.',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  status_id?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por rol de la organización',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID()
  role_id?: string;
}
