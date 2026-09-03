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
exports.BatchListResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const batch_response_dto_1 = require("./batch-response.dto");
class BatchListResponseDto {
    data;
    total;
    page;
    limit;
    totalPages;
}
exports.BatchListResponseDto = BatchListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [batch_response_dto_1.BatchResponseDto], description: 'Array of batch records' }),
    __metadata("design:type", Array)
], BatchListResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of records matching the filter' }),
    __metadata("design:type", Number)
], BatchListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current page number' }),
    __metadata("design:type", Number)
], BatchListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of records per page' }),
    __metadata("design:type", Number)
], BatchListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of pages' }),
    __metadata("design:type", Number)
], BatchListResponseDto.prototype, "totalPages", void 0);
//# sourceMappingURL=batch-list-response.dto.js.map