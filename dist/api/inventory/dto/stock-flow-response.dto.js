"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockFlowResponseDto = exports.StockFlowLedgerRowDto = exports.StockFlowSummaryRowDto = exports.StockFlowFiltersAppliedDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class StockFlowFiltersAppliedDto {
    period;
    period_label;
    date_from;
    date_to;
    fiscal_configuration_id;
    billing_branch_id;
    product_id;
    view;
}
exports.StockFlowFiltersAppliedDto = StockFlowFiltersAppliedDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowFiltersAppliedDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowFiltersAppliedDto.prototype, "period_label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowFiltersAppliedDto.prototype, "date_from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowFiltersAppliedDto.prototype, "date_to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowFiltersAppliedDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ nullable: true }),
    __metadata("design:type", Object)
], StockFlowFiltersAppliedDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ nullable: true }),
    __metadata("design:type", Object)
], StockFlowFiltersAppliedDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowFiltersAppliedDto.prototype, "view", void 0);
class StockFlowSummaryRowDto {
    product_id;
    product_sku;
    product_name;
    billing_branch_id;
    billing_branch_name;
    fiscal_configuration_name;
    uom_id;
    uom_name;
    opening_qty;
    purchases_qty;
    sales_qty;
    transfer_in_qty;
    transfer_out_qty;
    adjustments_qty;
    closing_qty;
}
exports.StockFlowSummaryRowDto = StockFlowSummaryRowDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowSummaryRowDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowSummaryRowDto.prototype, "product_sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowSummaryRowDto.prototype, "product_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowSummaryRowDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowSummaryRowDto.prototype, "billing_branch_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowSummaryRowDto.prototype, "fiscal_configuration_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowSummaryRowDto.prototype, "uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowSummaryRowDto.prototype, "uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Saldo al inicio del rango' }),
    __metadata("design:type", String)
], StockFlowSummaryRowDto.prototype, "opening_qty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Compras + importaciones en el rango' }),
    __metadata("design:type", String)
], StockFlowSummaryRowDto.prototype, "purchases_qty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Ventas netas (sale − sale_reversal) en el rango' }),
    __metadata("design:type", String)
], StockFlowSummaryRowDto.prototype, "sales_qty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowSummaryRowDto.prototype, "transfer_in_qty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowSummaryRowDto.prototype, "transfer_out_qty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Ajustes de auditoría (puede ser negativo)' }),
    __metadata("design:type", String)
], StockFlowSummaryRowDto.prototype, "adjustments_qty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Saldo al cierre del rango' }),
    __metadata("design:type", String)
], StockFlowSummaryRowDto.prototype, "closing_qty", void 0);
class StockFlowLedgerRowDto {
    id;
    occurred_at;
    product_id;
    product_sku;
    product_name;
    billing_branch_id;
    billing_branch_name;
    uom_name;
    movement_type;
    movement_type_label;
    title;
    description;
    quantity_in;
    quantity_out;
    balance_after;
    reference_folio;
    is_opening;
}
exports.StockFlowLedgerRowDto = StockFlowLedgerRowDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowLedgerRowDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowLedgerRowDto.prototype, "occurred_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowLedgerRowDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowLedgerRowDto.prototype, "product_sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowLedgerRowDto.prototype, "product_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowLedgerRowDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowLedgerRowDto.prototype, "billing_branch_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowLedgerRowDto.prototype, "uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowLedgerRowDto.prototype, "movement_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowLedgerRowDto.prototype, "movement_type_label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowLedgerRowDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowLedgerRowDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cantidad entrada (vacío si salida o saldo inicial)' }),
    __metadata("design:type", Object)
], StockFlowLedgerRowDto.prototype, "quantity_in", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cantidad salida' }),
    __metadata("design:type", Object)
], StockFlowLedgerRowDto.prototype, "quantity_out", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StockFlowLedgerRowDto.prototype, "balance_after", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ nullable: true }),
    __metadata("design:type", Object)
], StockFlowLedgerRowDto.prototype, "reference_folio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], StockFlowLedgerRowDto.prototype, "is_opening", void 0);
class StockFlowResponseDto {
    filters_applied;
    summary;
    ledger;
    total_summary_rows;
    total_ledger_rows;
}
exports.StockFlowResponseDto = StockFlowResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: StockFlowFiltersAppliedDto }),
    __metadata("design:type", StockFlowFiltersAppliedDto)
], StockFlowResponseDto.prototype, "filters_applied", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [StockFlowSummaryRowDto] }),
    __metadata("design:type", Array)
], StockFlowResponseDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [StockFlowLedgerRowDto] }),
    __metadata("design:type", Array)
], StockFlowResponseDto.prototype, "ledger", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], StockFlowResponseDto.prototype, "total_summary_rows", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], StockFlowResponseDto.prototype, "total_ledger_rows", void 0);
//# sourceMappingURL=stock-flow-response.dto.js.map