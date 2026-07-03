import { QuerySalesOrderDto } from './query-sales-order.dto';
import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Filtros opcionales para exportar cabeceras (sin rango obligatorio). */
export class QuerySalesOrderHeaderExportDto extends QuerySalesOrderDto {}

/** Detalle: rango de fechas obligatorio (por volumen de líneas). */
export class QuerySalesOrderDetailExportDto extends QuerySalesOrderHeaderExportDto {
  @ApiProperty({ example: '2026-06-01', description: 'Inicio del rango (fecha creación orden)' })
  @IsDateString()
  declare created_from: string;

  @ApiProperty({ example: '2026-06-30', description: 'Fin del rango (fecha creación orden)' })
  @IsDateString()
  declare created_to: string;
}
