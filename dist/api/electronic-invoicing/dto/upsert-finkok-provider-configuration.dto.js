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
exports.UpsertFinkokProviderConfigurationDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class UpsertFinkokProviderConfigurationDto {
    environment;
    finkok_username;
    finkok_password;
    is_active;
    is_stamping_default;
}
exports.UpsertFinkokProviderConfigurationDto = UpsertFinkokProviderConfigurationDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El ambiente es obligatorio' }),
    (0, class_validator_1.IsEnum)(['demo', 'production'], {
        message: 'El ambiente debe ser demo o production',
    }),
    __metadata("design:type", String)
], UpsertFinkokProviderConfigurationDto.prototype, "environment", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El usuario de Finkok es obligatorio' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpsertFinkokProviderConfigurationDto.prototype, "finkok_username", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => (value === '' || value === null ? undefined : value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertFinkokProviderConfigurationDto.prototype, "finkok_password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], UpsertFinkokProviderConfigurationDto.prototype, "is_active", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], UpsertFinkokProviderConfigurationDto.prototype, "is_stamping_default", void 0);
//# sourceMappingURL=upsert-finkok-provider-configuration.dto.js.map