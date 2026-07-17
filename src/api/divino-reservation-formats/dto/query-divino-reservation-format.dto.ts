import { IsOptional, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDivinoReservationFormatDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /** Búsqueda por folio, comprador, correo, recibido de o código de lote. */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['draft', 'sent'])
  status?: string;

  @IsOptional()
  @IsString()
  property_id?: string;
}
