"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryInventorySummaryExportDto = exports.QueryInventoryBatchExportDto = void 0;
const batch_filter_dto_1 = require("./batch-filter.dto");
const inventory_summary_filter_dto_1 = require("./inventory-summary-filter.dto");
class QueryInventoryBatchExportDto extends batch_filter_dto_1.BatchFilterDto {
}
exports.QueryInventoryBatchExportDto = QueryInventoryBatchExportDto;
class QueryInventorySummaryExportDto extends inventory_summary_filter_dto_1.InventorySummaryFilterDto {
}
exports.QueryInventorySummaryExportDto = QueryInventorySummaryExportDto;
//# sourceMappingURL=query-inventory-export.dto.js.map