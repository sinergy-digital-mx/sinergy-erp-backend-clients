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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneCountriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const phone_countries_service_1 = require("./phone-countries.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let PhoneCountriesController = class PhoneCountriesController {
    phoneCountriesService;
    constructor(phoneCountriesService) {
        this.phoneCountriesService = phoneCountriesService;
    }
    async findAll() {
        return this.phoneCountriesService.findAll();
    }
    async search(query) {
        if (!query || query.length < 1) {
            return [];
        }
        return this.phoneCountriesService.search(query);
    }
    async findByCountryCode(code) {
        return this.phoneCountriesService.findByCountryCode(code);
    }
    async findByPhoneCode(phoneCode) {
        return this.phoneCountriesService.findByPhoneCode(phoneCode);
    }
};
exports.PhoneCountriesController = PhoneCountriesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all phone countries' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of all phone countries',
        schema: {
            example: [
                {
                    id: 1,
                    country_name: 'United States',
                    country_code: 'US',
                    phone_code: '+1',
                    flag_emoji: '🇺🇸',
                    is_active: true,
                },
                {
                    id: 2,
                    country_name: 'Mexico',
                    country_code: 'MX',
                    phone_code: '+52',
                    flag_emoji: '🇲🇽',
                    is_active: true,
                },
            ],
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PhoneCountriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search phone countries by name, code, or phone code' }),
    (0, swagger_1.ApiQuery)({ name: 'q', description: 'Search query (country name, code, or phone code)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Filtered list of phone countries',
    }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PhoneCountriesController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('by-code'),
    (0, swagger_1.ApiOperation)({ summary: 'Get phone country by country code' }),
    (0, swagger_1.ApiQuery)({ name: 'code', description: 'Country code (e.g., US, MX, ES)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Phone country details',
    }),
    __param(0, (0, common_1.Query)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PhoneCountriesController.prototype, "findByCountryCode", null);
__decorate([
    (0, common_1.Get)('by-phone-code'),
    (0, swagger_1.ApiOperation)({ summary: 'Get phone country by phone code' }),
    (0, swagger_1.ApiQuery)({ name: 'phone_code', description: 'Phone code (e.g., +1, +52, +34)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Phone country details',
    }),
    __param(0, (0, common_1.Query)('phone_code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PhoneCountriesController.prototype, "findByPhoneCode", null);
exports.PhoneCountriesController = PhoneCountriesController = __decorate([
    (0, common_1.Controller)('phone-countries'),
    (0, swagger_1.ApiTags)('Phone Countries'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [phone_countries_service_1.PhoneCountriesService])
], PhoneCountriesController);
//# sourceMappingURL=phone-countries.controller.js.map