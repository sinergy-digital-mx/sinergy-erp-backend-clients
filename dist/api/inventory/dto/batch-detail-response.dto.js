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
exports.BatchDetailResponseDto = exports.MovementSummaryDto = exports.BatchAuditHistoryItemDto = exports.BatchTransferHistoryItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const inventory_batch_movement_dto_1 = require("./inventory-batch-movement.dto");
class BatchTransferHistoryItemDto {
    transfer_id;
    transfer_folio;
    direction;
    quantity;
    related_batch_id;
    related_batch_number;
    warehouse_name;
    created_at;
}
exports.BatchTransferHistoryItemDto = BatchTransferHistoryItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchTransferHistoryItemDto.prototype, "transfer_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchTransferHistoryItemDto.prototype, "transfer_folio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchTransferHistoryItemDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchTransferHistoryItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchTransferHistoryItemDto.prototype, "related_batch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchTransferHistoryItemDto.prototype, "related_batch_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchTransferHistoryItemDto.prototype, "warehouse_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], BatchTransferHistoryItemDto.prototype, "created_at", void 0);
class BatchAuditHistoryItemDto {
    audit_id;
    audit_folio;
    system_quantity;
    counted_quantity;
    variance;
    quantity_before_post;
    quantity_after_post;
    reason;
    counted_by_name;
    authorized_by_name;
    authorized_at;
}
exports.BatchAuditHistoryItemDto = BatchAuditHistoryItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchAuditHistoryItemDto.prototype, "audit_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchAuditHistoryItemDto.prototype, "audit_folio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchAuditHistoryItemDto.prototype, "system_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchAuditHistoryItemDto.prototype, "counted_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchAuditHistoryItemDto.prototype, "variance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchAuditHistoryItemDto.prototype, "quantity_before_post", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchAuditHistoryItemDto.prototype, "quantity_after_post", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchAuditHistoryItemDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchAuditHistoryItemDto.prototype, "counted_by_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchAuditHistoryItemDto.prototype, "authorized_by_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchAuditHistoryItemDto.prototype, "authorized_at", void 0);
class MovementSummaryDto {
    total_movements;
    total_out;
    total_in;
    by_type;
}
exports.MovementSummaryDto = MovementSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MovementSummaryDto.prototype, "total_movements", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MovementSummaryDto.prototype, "total_out", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MovementSummaryDto.prototype, "total_in", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: 'object',
        properties: {
            orders: { type: 'number' },
            transfers_out: { type: 'number' },
            transfers_in: { type: 'number' },
            adjustments: { type: 'number' },
        },
    }),
    __metadata("design:type", Object)
], MovementSummaryDto.prototype, "by_type", void 0);
class BatchDetailResponseDto {
    id;
    batch_number;
    source_tag_identifier;
    measure;
    measure_uom_id;
    measure_uom_name;
    measure_label;
    product_id;
    product_name;
    product_sku;
    warehouse_id;
    warehouse_name;
    fiscal_configuration_id;
    razon_social;
    billing_branch_id;
    sucursal;
    purchase_order_id;
    purchase_order_batch_id;
    purchase_order_detail_id;
    purchase_order_folio;
    pedimento_number;
    payment_currency;
    unit_cost;
    real_unit_cost_usd;
    real_unit_cost_mxn;
    customs_exchange_rate;
    suggested_unit_price;
    suggested_price_currency;
    uom_id;
    uom_name;
    initial_quantity;
    available_quantity;
    quantity_consumed;
    availability_percentage;
    created_by;
    created_at;
    transferred_from_batch_id;
    transferred_from_batch_number;
    transfer_history;
    audit_history;
    movements;
    movements_count;
    movement_summary;
    can_edit_tag;
    can_edit_measure;
    can_transfer;
}
exports.BatchDetailResponseDto = BatchDetailResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchDetailResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchDetailResponseDto.prototype, "batch_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "source_tag_identifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        nullable: true,
        description: 'Tamaño (8, 12). Independiente de uom_id / uom_name (PT, ft²).',
    }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "measure", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "measure_uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "measure_uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Ej. "8 Foot"' }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "measure_label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchDetailResponseDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchDetailResponseDto.prototype, "product_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchDetailResponseDto.prototype, "product_sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchDetailResponseDto.prototype, "warehouse_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchDetailResponseDto.prototype, "warehouse_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Razón social ID' }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Razón social' }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "razon_social", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Sucursal ID' }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Nombre de sucursal' }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "sucursal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "purchase_order_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "purchase_order_batch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "purchase_order_detail_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "purchase_order_folio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        nullable: true,
        description: 'Número de pedimento de la OC de origen. Null si no hay OC o la OC no tiene pedimento.',
    }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "pedimento_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        nullable: true,
        description: 'Moneda de la OC de origen (costo proveedor).',
    }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "payment_currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        nullable: true,
        description: 'Costo unitario de proveedor/recepción. Hasta 4 decimales.',
    }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "unit_cost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Costo real unitario en USD (T.C. de aduana).' }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "real_unit_cost_usd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Costo real unitario en MXN (T.C. de aduana).' }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "real_unit_cost_mxn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Tipo de cambio de aduana de la OC.' }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "customs_exchange_rate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Precio sugerido de la primera lista activa.' }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "suggested_unit_price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Moneda del precio sugerido.' }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "suggested_price_currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchDetailResponseDto.prototype, "uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchDetailResponseDto.prototype, "uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchDetailResponseDto.prototype, "initial_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchDetailResponseDto.prototype, "available_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchDetailResponseDto.prototype, "quantity_consumed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BatchDetailResponseDto.prototype, "availability_percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchDetailResponseDto.prototype, "created_by", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], BatchDetailResponseDto.prototype, "created_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Lote origen si este lote fue creado por transferencia' }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "transferred_from_batch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchDetailResponseDto.prototype, "transferred_from_batch_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BatchTransferHistoryItemDto] }),
    __metadata("design:type", Array)
], BatchDetailResponseDto.prototype, "transfer_history", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BatchAuditHistoryItemDto] }),
    __metadata("design:type", Array)
], BatchDetailResponseDto.prototype, "audit_history", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [inventory_batch_movement_dto_1.InventoryBatchMovementDto] }),
    __metadata("design:type", Array)
], BatchDetailResponseDto.prototype, "movements", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BatchDetailResponseDto.prototype, "movements_count", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: MovementSummaryDto }),
    __metadata("design:type", MovementSummaryDto)
], BatchDetailResponseDto.prototype, "movement_summary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Siempre true. El tag se puede cambiar o borrar.' }),
    __metadata("design:type", Boolean)
], BatchDetailResponseDto.prototype, "can_edit_tag", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'True solo si measure es null (no se capturó en el recibo). Una vez definida, no se edita.',
    }),
    __metadata("design:type", Boolean)
], BatchDetailResponseDto.prototype, "can_edit_measure", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'True si hay disponible. El almacén se cambia con transferencia, no con PATCH.',
    }),
    __metadata("design:type", Boolean)
], BatchDetailResponseDto.prototype, "can_transfer", void 0);
//# sourceMappingURL=batch-detail-response.dto.js.map