import { OmitType } from '@nestjs/swagger';
import { QueryProductDto } from './query-product.dto';

/** Filtros para exportar catálogo (mismos que el listado, sin paginación). */
export class QueryProductExportDto extends OmitType(QueryProductDto, [
  'page',
  'limit',
] as const) {}
