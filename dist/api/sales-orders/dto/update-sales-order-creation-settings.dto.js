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
exports.UpdateSalesOrderCreationSettingsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateSalesOrderCreationSettingsDto {
    fields;
}
exports.UpdateSalesOrderCreationSettingsDto = UpdateSalesOrderCreationSettingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Visibilidad, obligatoriedad y valor por defecto de cada campo del alta. Cliente y razón social quedan bloqueados.',
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateSalesOrderCreationSettingsDto.prototype, "fields", void 0);
//# sourceMappingURL=update-sales-order-creation-settings.dto.js.map