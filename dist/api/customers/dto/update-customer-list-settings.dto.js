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
exports.UpdateCustomerListSettingsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const customer_list_settings_util_1 = require("../utils/customer-list-settings.util");
class UpdateCustomerListSettingsDto {
    prefilter;
}
exports.UpdateCustomerListSettingsDto = UpdateCustomerListSettingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: customer_list_settings_util_1.CUSTOMER_LIST_PREFILTERS,
        description: 'off: el listado abre sin razón ni sucursal. sellers: solo quien no tiene customers:ViewAll entra con la suya. everyone: todos entran con la suya. En los tres casos el select permite ver todas.',
        example: 'sellers',
    }),
    (0, class_validator_1.IsIn)(customer_list_settings_util_1.CUSTOMER_LIST_PREFILTERS),
    __metadata("design:type", Object)
], UpdateCustomerListSettingsDto.prototype, "prefilter", void 0);
//# sourceMappingURL=update-customer-list-settings.dto.js.map