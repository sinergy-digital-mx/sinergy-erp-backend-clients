import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const toOptionalBoolean = ({ value }: { value: unknown }): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1' || value === 1) return true;
  if (value === false || value === 'false' || value === '0' || value === 0) return false;
  return undefined;
};

export class QueryVendorProductsDto {
  @ApiPropertyOptional({ description: 'Filtrar por nombre, SKU o SKU externo' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Incluir productos activos sin costo de este proveedor',
  })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  include_without_cost?: boolean;

  @ApiPropertyOptional({
    description: 'Solo productos con costo de este proveedor (comportamiento anterior)',
  })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  only_with_cost?: boolean;
}
