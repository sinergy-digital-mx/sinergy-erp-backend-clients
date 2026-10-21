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
exports.CloneSalesOrderDto = exports.CloneSalesOrderLineDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CloneSalesOrderLineDto {
    line_id;
    custom_description;
    unit_price;
}
exports.CloneSalesOrderLineDto = CloneSalesOrderLineDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID de la línea de la orden origen' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CloneSalesOrderLineDto.prototype, "line_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Concepto nuevo de la línea (ej. «Desarrollo de software septiembre»).',
    }),
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CloneSalesOrderLineDto.prototype, "custom_description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Precio unitario nuevo (hasta 4 decimales).' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CloneSalesOrderLineDto.prototype, "unit_price", void 0);
class CloneSalesOrderDto {
    lines;
    notes;
    expected_delivery_date;
}
exports.CloneSalesOrderDto = CloneSalesOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        type: [CloneSalesOrderLineDto],
        description: 'Líneas a modificar. Las que no se envían se copian igual.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CloneSalesOrderLineDto),
    __metadata("design:type", Array)
], CloneSalesOrderDto.prototype, "lines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Notas de la nueva orden. Si se omite se copian las originales.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CloneSalesOrderDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Fecha de entrega (YYYY-MM-DD). Si se omite, hoy.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CloneSalesOrderDto.prototype, "expected_delivery_date", void 0);
//# sourceMappingURL=clone-sales-order.dto.js.map