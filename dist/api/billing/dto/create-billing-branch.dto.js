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
exports.CreateBillingBranchDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const branch_warehouse_dto_1 = require("./branch-warehouse.dto");
class CreateBillingBranchDto {
    name;
    code;
    prefix;
    address;
    city;
    state;
    country;
    postal_code;
    phone;
    latitude;
    longitude;
    status;
    warehouses;
}
exports.CreateBillingBranchDto = CreateBillingBranchDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre de la sucursal (lo que se muestra en UI)',
        example: 'Sucursal Buenos Aires',
    }),
    (0, class_validator_1.ValidateIf)((dto) => !dto.code),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre de la sucursal es obligatorio' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBillingBranchDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Alias legado de name. La UI nueva debe enviar name, no code.',
        example: 'Sucursal Buenos Aires',
    }),
    (0, class_validator_1.ValidateIf)((dto) => !dto.name),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBillingBranchDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Prefijo para lotes de recepción (ej. SBA). Letras/números, máx. 10, sin guiones',
        example: 'SBA',
        maxLength: 10,
        nullable: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", Object)
], CreateBillingBranchDto.prototype, "prefix", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Street address', example: 'Av. Principal 123' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBillingBranchDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'City', example: 'Monterrey' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBillingBranchDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'State', example: 'Nuevo León' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBillingBranchDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Country', example: 'México' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBillingBranchDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Postal code', example: '64000' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBillingBranchDto.prototype, "postal_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Teléfono de contacto de la sucursal',
        example: '6641234567',
        required: false,
        nullable: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], CreateBillingBranchDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Latitud GPS (Google Maps)',
        example: 32.5149,
        nullable: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Object)
], CreateBillingBranchDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Longitud GPS (Google Maps)',
        example: -117.0382,
        nullable: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Object)
], CreateBillingBranchDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Status: 1 = active, 0 = inactive', example: 1, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], CreateBillingBranchDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Almacenes vinculados a la sucursal',
        type: [branch_warehouse_dto_1.BranchWarehouseDto],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => branch_warehouse_dto_1.BranchWarehouseDto),
    __metadata("design:type", Array)
], CreateBillingBranchDto.prototype, "warehouses", void 0);
//# sourceMappingURL=create-billing-branch.dto.js.map