import { BatchFilterDto } from './batch-filter.dto';
import { InventorySummaryFilterDto } from './inventory-summary-filter.dto';

/** Filtros para exportar lotes (mismos que el listado, sin paginación). */
export class QueryInventoryBatchExportDto extends BatchFilterDto {}

/** Filtros para exportar inventario totalizado (mismos que el listado, sin paginación). */
export class QueryInventorySummaryExportDto extends InventorySummaryFilterDto {}
