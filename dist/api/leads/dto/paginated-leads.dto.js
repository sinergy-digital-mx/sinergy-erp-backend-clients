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
exports.PaginatedLeadsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const lead_entity_1 = require("../../../entities/leads/lead.entity");
class PaginatedLeadsDto {
    data;
    total;
    page;
    limit;
    totalPages;
    hasNext;
    hasPrev;
}
exports.PaginatedLeadsDto = PaginatedLeadsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of leads',
        type: [lead_entity_1.Lead]
    }),
    __metadata("design:type", Array)
], PaginatedLeadsDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of leads',
        example: 150
    }),
    __metadata("design:type", Number)
], PaginatedLeadsDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Current page number',
        example: 1
    }),
    __metadata("design:type", Number)
], PaginatedLeadsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of items per page',
        example: 20
    }),
    __metadata("design:type", Number)
], PaginatedLeadsDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of pages',
        example: 8
    }),
    __metadata("design:type", Number)
], PaginatedLeadsDto.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether there is a next page',
        example: true
    }),
    __metadata("design:type", Boolean)
], PaginatedLeadsDto.prototype, "hasNext", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether there is a previous page',
        example: false
    }),
    __metadata("design:type", Boolean)
], PaginatedLeadsDto.prototype, "hasPrev", void 0);
//# sourceMappingURL=paginated-leads.dto.js.map