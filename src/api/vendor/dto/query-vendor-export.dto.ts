import { OmitType } from '@nestjs/swagger';
import { QueryVendorDto } from './query-vendor.dto';

/** Filtros para exportar proveedores (mismos que el listado, sin paginación). */
export class QueryVendorExportDto extends OmitType(QueryVendorDto, [
  'page',
  'limit',
] as const) {}
