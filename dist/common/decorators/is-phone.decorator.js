"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsPhoneConstraint = void 0;
exports.IsPhone = IsPhone;
const class_validator_1 = require("class-validator");
const phone_validator_1 = require("../utils/phone.validator");
let IsPhoneConstraint = class IsPhoneConstraint {
    validate(value) {
        if (!value || typeof value !== 'string') {
            return false;
        }
        const result = (0, phone_validator_1.parsePhoneNumber)(value);
        return result.isValid;
    }
    defaultMessage() {
        return 'Phone number must be in E.164 format (e.g., +52 6647945661)';
    }
};
exports.IsPhoneConstraint = IsPhoneConstraint;
exports.IsPhoneConstraint = IsPhoneConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isPhone', async: false })
], IsPhoneConstraint);
function IsPhone(validationOptions) {
    return function (target, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: target.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsPhoneConstraint,
        });
    };
}
//# sourceMappingURL=is-phone.decorator.js.map