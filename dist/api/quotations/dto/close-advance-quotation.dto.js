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
exports.CloseAdvanceQuotationDto = void 0;
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const create_quotation_dto_1 = require("./create-quotation.dto");
class CloseAdvanceQuotationDto {
    line_items;
    environment;
}
exports.CloseAdvanceQuotationDto = CloseAdvanceQuotationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [create_quotation_dto_1.CreateQuotationLineItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => create_quotation_dto_1.CreateQuotationLineItemDto),
    __metadata("design:type", Array)
], CloseAdvanceQuotationDto.prototype, "line_items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['demo', 'production'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['demo', 'production']),
    __metadata("design:type", String)
], CloseAdvanceQuotationDto.prototype, "environment", void 0);
//# sourceMappingURL=close-advance-quotation.dto.js.map