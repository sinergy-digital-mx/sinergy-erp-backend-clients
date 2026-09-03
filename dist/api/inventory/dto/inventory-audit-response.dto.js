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
exports.InventoryAuditContextResponseDto = exports.InventoryAuditContextBatchDto = exports.InventoryAuditListResponseDto = exports.InventoryAuditResponseDto = exports.InventoryAuditTotalsDto = exports.InventoryAuditLineResponseDto = exports.InventoryAuditWarehouseSummaryDto = exports.InventoryAuditUserSummaryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const inventory_audit_status_enum_1 = require("../../../entities/inventory/inventory-audit-status.enum");
class InventoryAuditUserSummaryDto {
    id;
    name;
    email;
}
exports.InventoryAuditUserSummaryDto = InventoryAuditUserSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditUserSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditUserSummaryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditUserSummaryDto.prototype, "email", void 0);
class InventoryAuditWarehouseSummaryDto {
    id;
    name;
    code;
    billing_branch_id;
    billing_branch_code;
    billing_branch_city;
    billing_branch_state;
    fiscal_configuration_id;
    fiscal_razon_social;
    fiscal_rfc;
}
exports.InventoryAuditWarehouseSummaryDto = InventoryAuditWarehouseSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditWarehouseSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditWarehouseSummaryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditWarehouseSummaryDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditWarehouseSummaryDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditWarehouseSummaryDto.prototype, "billing_branch_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditWarehouseSummaryDto.prototype, "billing_branch_city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditWarehouseSummaryDto.prototype, "billing_branch_state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditWarehouseSummaryDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditWarehouseSummaryDto.prototype, "fiscal_razon_social", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditWarehouseSummaryDto.prototype, "fiscal_rfc", void 0);
class InventoryAuditLineResponseDto {
    id;
    inventory_batch_id;
    batch_number;
    source_tag_identifier;
    measure;
    measure_uom_id;
    measure_uom_name;
    measure_label;
    product_id;
    product_name;
    product_sku;
    uom_id;
    uom_name;
    system_quantity;
    counted_quantity;
    variance;
    reason;
    is_additional;
    counted_by_user;
    counted_at;
    quantity_before_post;
    quantity_after_post;
    stock_moved_during_count;
    created_at;
}
exports.InventoryAuditLineResponseDto = InventoryAuditLineResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditLineResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditLineResponseDto.prototype, "inventory_batch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditLineResponseDto.prototype, "batch_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLineResponseDto.prototype, "source_tag_identifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLineResponseDto.prototype, "measure", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLineResponseDto.prototype, "measure_uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLineResponseDto.prototype, "measure_uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLineResponseDto.prototype, "measure_label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditLineResponseDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditLineResponseDto.prototype, "product_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditLineResponseDto.prototype, "product_sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditLineResponseDto.prototype, "uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditLineResponseDto.prototype, "uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditLineResponseDto.prototype, "system_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLineResponseDto.prototype, "counted_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLineResponseDto.prototype, "variance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLineResponseDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], InventoryAuditLineResponseDto.prototype, "is_additional", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, type: InventoryAuditUserSummaryDto }),
    __metadata("design:type", Object)
], InventoryAuditLineResponseDto.prototype, "counted_by_user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLineResponseDto.prototype, "counted_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLineResponseDto.prototype, "quantity_before_post", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLineResponseDto.prototype, "quantity_after_post", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], InventoryAuditLineResponseDto.prototype, "stock_moved_during_count", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], InventoryAuditLineResponseDto.prototype, "created_at", void 0);
class InventoryAuditTotalsDto {
    total_lines;
    counted_lines;
    pending_lines;
    lines_with_variance;
    total_system_quantity;
    total_counted_quantity;
    total_variance;
}
exports.InventoryAuditTotalsDto = InventoryAuditTotalsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryAuditTotalsDto.prototype, "total_lines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryAuditTotalsDto.prototype, "counted_lines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryAuditTotalsDto.prototype, "pending_lines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryAuditTotalsDto.prototype, "lines_with_variance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditTotalsDto.prototype, "total_system_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditTotalsDto.prototype, "total_counted_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditTotalsDto.prototype, "total_variance", void 0);
class InventoryAuditResponseDto {
    id;
    folio;
    status;
    warehouse;
    product_id;
    product_name;
    product_sku;
    include_empty_lots;
    notes;
    created_by_user;
    created_at;
    submitted_by_user;
    submitted_at;
    authorized_by_user;
    authorized_at;
    rejected_by_user;
    rejected_at;
    rejection_reason;
    cancelled_by_user;
    cancelled_at;
    cancellation_reason;
    totals;
    lines;
}
exports.InventoryAuditResponseDto = InventoryAuditResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditResponseDto.prototype, "folio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: inventory_audit_status_enum_1.InventoryAuditStatus }),
    __metadata("design:type", String)
], InventoryAuditResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InventoryAuditWarehouseSummaryDto }),
    __metadata("design:type", InventoryAuditWarehouseSummaryDto)
], InventoryAuditResponseDto.prototype, "warehouse", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditResponseDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditResponseDto.prototype, "product_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditResponseDto.prototype, "product_sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], InventoryAuditResponseDto.prototype, "include_empty_lots", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditResponseDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InventoryAuditUserSummaryDto }),
    __metadata("design:type", InventoryAuditUserSummaryDto)
], InventoryAuditResponseDto.prototype, "created_by_user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], InventoryAuditResponseDto.prototype, "created_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, type: InventoryAuditUserSummaryDto }),
    __metadata("design:type", Object)
], InventoryAuditResponseDto.prototype, "submitted_by_user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditResponseDto.prototype, "submitted_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, type: InventoryAuditUserSummaryDto }),
    __metadata("design:type", Object)
], InventoryAuditResponseDto.prototype, "authorized_by_user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditResponseDto.prototype, "authorized_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, type: InventoryAuditUserSummaryDto }),
    __metadata("design:type", Object)
], InventoryAuditResponseDto.prototype, "rejected_by_user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditResponseDto.prototype, "rejected_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditResponseDto.prototype, "rejection_reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, type: InventoryAuditUserSummaryDto }),
    __metadata("design:type", Object)
], InventoryAuditResponseDto.prototype, "cancelled_by_user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditResponseDto.prototype, "cancelled_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditResponseDto.prototype, "cancellation_reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InventoryAuditTotalsDto }),
    __metadata("design:type", InventoryAuditTotalsDto)
], InventoryAuditResponseDto.prototype, "totals", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InventoryAuditLineResponseDto] }),
    __metadata("design:type", Array)
], InventoryAuditResponseDto.prototype, "lines", void 0);
class InventoryAuditListResponseDto {
    data;
    total;
    page;
    limit;
    totalPages;
}
exports.InventoryAuditListResponseDto = InventoryAuditListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InventoryAuditResponseDto] }),
    __metadata("design:type", Array)
], InventoryAuditListResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryAuditListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryAuditListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryAuditListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryAuditListResponseDto.prototype, "totalPages", void 0);
class InventoryAuditContextBatchDto {
    batch_id;
    batch_number;
    source_tag_identifier;
    measure;
    measure_uom_id;
    measure_uom_name;
    measure_label;
    product_id;
    product_name;
    product_sku;
    uom_id;
    uom_name;
    available_quantity;
    initial_quantity;
    purchase_order_folio;
    created_at;
}
exports.InventoryAuditContextBatchDto = InventoryAuditContextBatchDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditContextBatchDto.prototype, "batch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditContextBatchDto.prototype, "batch_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditContextBatchDto.prototype, "source_tag_identifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditContextBatchDto.prototype, "measure", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditContextBatchDto.prototype, "measure_uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditContextBatchDto.prototype, "measure_uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditContextBatchDto.prototype, "measure_label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditContextBatchDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditContextBatchDto.prototype, "product_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditContextBatchDto.prototype, "product_sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditContextBatchDto.prototype, "uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditContextBatchDto.prototype, "uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditContextBatchDto.prototype, "available_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditContextBatchDto.prototype, "initial_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditContextBatchDto.prototype, "purchase_order_folio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], InventoryAuditContextBatchDto.prototype, "created_at", void 0);
class InventoryAuditContextResponseDto {
    warehouse;
    total_batches;
    total_available_quantity;
    open_audit_id;
    open_audit_folio;
    batches;
}
exports.InventoryAuditContextResponseDto = InventoryAuditContextResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: InventoryAuditWarehouseSummaryDto }),
    __metadata("design:type", InventoryAuditWarehouseSummaryDto)
], InventoryAuditContextResponseDto.prototype, "warehouse", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryAuditContextResponseDto.prototype, "total_batches", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryAuditContextResponseDto.prototype, "total_available_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditContextResponseDto.prototype, "open_audit_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditContextResponseDto.prototype, "open_audit_folio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InventoryAuditContextBatchDto] }),
    __metadata("design:type", Array)
], InventoryAuditContextResponseDto.prototype, "batches", void 0);
//# sourceMappingURL=inventory-audit-response.dto.js.map