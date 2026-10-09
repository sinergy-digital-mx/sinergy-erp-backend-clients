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
exports.QueryCustomersDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const customer_list_insight_util_1 = require("../utils/customer-list-insight.util");
class QueryCustomersDto {
    page;
    limit;
    search;
    status_id;
    group_id;
    registered_fiscal_configuration_id;
    insight;
}
exports.QueryCustomersDto = QueryCustomersDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Page number (1-based)',
        minimum: 1,
        default: 1,
        example: 1
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryCustomersDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Number of items per page',
        minimum: 1,
        maximum: 100,
        default: 20,
        example: 20
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QueryCustomersDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Search term: name, full name, email, phone, company, RFC, fiscal name, contacts, contracts',
        example: 'john'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryCustomersDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by status ID',
        example: 1
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], QueryCustomersDto.prototype, "status_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by customer group ID',
        example: 'uuid-here'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryCustomersDto.prototype, "group_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Razón social de registro asignada al cliente',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryCustomersDto.prototype, "registered_fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Corte del resumen. Requiere el permiso ViewStats; si no, se ignora.',
        enum: customer_list_insight_util_1.CUSTOMER_LIST_INSIGHTS,
        example: 'fiscal_not_ready',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(customer_list_insight_util_1.CUSTOMER_LIST_INSIGHTS),
    __metadata("design:type", String)
], QueryCustomersDto.prototype, "insight", void 0);
//# sourceMappingURL=query-customers.dto.js.map