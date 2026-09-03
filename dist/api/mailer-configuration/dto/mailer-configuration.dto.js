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
exports.MailerConfigurationDto = void 0;
const class_transformer_1 = require("class-transformer");
const mailer_vendor_enum_1 = require("../enums/mailer-vendor.enum");
let MailerConfigurationDto = class MailerConfigurationDto {
    id;
    tenantId;
    name;
    vendor;
    vendorConfig;
    isActive;
    isFallback;
    isValid;
    createdAt;
    createdBy;
    updatedAt;
    updatedBy;
    lastTestResult;
    lastTestTimestamp;
    lastUsedTimestamp;
};
exports.MailerConfigurationDto = MailerConfigurationDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MailerConfigurationDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], MailerConfigurationDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MailerConfigurationDto.prototype, "name", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MailerConfigurationDto.prototype, "vendor", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'vendor_config' }),
    __metadata("design:type", Object)
], MailerConfigurationDto.prototype, "vendorConfig", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'is_active' }),
    __metadata("design:type", Boolean)
], MailerConfigurationDto.prototype, "isActive", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'is_fallback' }),
    __metadata("design:type", Boolean)
], MailerConfigurationDto.prototype, "isFallback", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'is_valid' }),
    __metadata("design:type", Boolean)
], MailerConfigurationDto.prototype, "isValid", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'created_at' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], MailerConfigurationDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'created_by' }),
    __metadata("design:type", String)
], MailerConfigurationDto.prototype, "createdBy", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'updated_at' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], MailerConfigurationDto.prototype, "updatedAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'updated_by' }),
    __metadata("design:type", String)
], MailerConfigurationDto.prototype, "updatedBy", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'last_test_result' }),
    (0, class_transformer_1.Type)(() => Object),
    __metadata("design:type", Object)
], MailerConfigurationDto.prototype, "lastTestResult", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'last_test_timestamp' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], MailerConfigurationDto.prototype, "lastTestTimestamp", void 0);
__decorate([
    (0, class_transformer_1.Expose)({ name: 'last_used_timestamp' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], MailerConfigurationDto.prototype, "lastUsedTimestamp", void 0);
exports.MailerConfigurationDto = MailerConfigurationDto = __decorate([
    (0, class_transformer_1.Exclude)()
], MailerConfigurationDto);
//# sourceMappingURL=mailer-configuration.dto.js.map