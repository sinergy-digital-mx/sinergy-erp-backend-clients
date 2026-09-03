"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorValidationService = void 0;
const common_1 = require("@nestjs/common");
let VendorValidationService = class VendorValidationService {
    validateResendApiKey(apiKey) {
        const errors = [];
        if (!apiKey) {
            errors.push('API key is required');
        }
        else if (typeof apiKey !== 'string' || apiKey.length < 10) {
            errors.push('API key must be a string with at least 10 characters');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
};
exports.VendorValidationService = VendorValidationService;
exports.VendorValidationService = VendorValidationService = __decorate([
    (0, common_1.Injectable)()
], VendorValidationService);
//# sourceMappingURL=vendor-validation.service.js.map