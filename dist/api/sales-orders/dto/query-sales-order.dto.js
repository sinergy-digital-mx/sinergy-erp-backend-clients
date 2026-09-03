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
exports.QuerySalesOrderDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const GENERAL_STATUS_VALUES = [
    'Creada',
    'En Selección',
    'Lista para entrega',
    'Surtida',
    'Cancelada',
    'En cola',
    'En Camino',
];
function parseGeneralStatuses(value) {
    if (value === undefined || value === null || value === '')
        return undefined;
    const parts = (Array.isArray(value) ? value : String(value).split(','))
        .map((v) => String(v).trim())
        .filter(Boolean);
    return parts.length > 0 ? parts : undefined;
}
class QuerySalesOrderDto {
    search;
    general_status;
    payment_status;
    is_credit;
    sales_order_type;
    collection_channel;
    fiscal_configuration_id;
    billing_branch_id;
    customer_id;
    created_from;
    created_to;
    page = 1;
    limit = 20;
    sort_by = 'created_at';
    sort_order = 'DESC';
}
exports.QuerySalesOrderDto = QuerySalesOrderDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuerySalesOrderDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseGeneralStatuses(value)),
    (0, class_validator_1.IsEnum)(GENERAL_STATUS_VALUES, { each: true }),
    __metadata("design:type", Array)
], QuerySalesOrderDto.prototype, "general_status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['Pendiente', 'Pagado']),
    __metadata("design:type", String)
], QuerySalesOrderDto.prototype, "payment_status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === true || value === 'true' || value === '1')
            return true;
        if (value === false || value === 'false' || value === '0')
            return false;
        return value;
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QuerySalesOrderDto.prototype, "is_credit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['POS', 'MANUAL']),
    __metadata("design:type", String)
], QuerySalesOrderDto.prototype, "sales_order_type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['pos_cobranza', 'manual', 'mixed']),
    __metadata("design:type", String)
], QuerySalesOrderDto.prototype, "collection_channel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QuerySalesOrderDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QuerySalesOrderDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], QuerySalesOrderDto.prototype, "customer_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QuerySalesOrderDto.prototype, "created_from", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QuerySalesOrderDto.prototype, "created_to", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QuerySalesOrderDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QuerySalesOrderDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['created_at', 'folio', 'total']),
    __metadata("design:type", String)
], QuerySalesOrderDto.prototype, "sort_by", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['ASC', 'DESC']),
    __metadata("design:type", String)
], QuerySalesOrderDto.prototype, "sort_order", void 0);
//# sourceMappingURL=query-sales-order.dto.js.map