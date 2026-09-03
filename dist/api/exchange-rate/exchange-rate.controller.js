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
exports.ExchangeRateController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const exchange_rate_service_1 = require("./exchange-rate.service");
const set_daily_exchange_rate_dto_1 = require("./dto/set-daily-exchange-rate.dto");
const query_exchange_rate_dto_1 = require("./dto/query-exchange-rate.dto");
let ExchangeRateController = class ExchangeRateController {
    exchangeRateService;
    constructor(exchangeRateService) {
        this.exchangeRateService = exchangeRateService;
    }
    setDailyRate(dto, req) {
        return this.exchangeRateService.setDailyRate(this.getTenantId(req), dto);
    }
    getDailyRate(date, req) {
        return this.exchangeRateService.getDailyRate(this.getTenantId(req), date);
    }
    findAll(query, req) {
        return this.exchangeRateService.findAll(this.getTenantId(req), query);
    }
    getTenantId(req) {
        return req.user?.tenant_id ?? req.user?.tenantId;
    }
};
exports.ExchangeRateController = ExchangeRateController;
__decorate([
    (0, common_1.Put)('daily'),
    (0, require_permissions_decorator_1.RequirePermission)('ExchangeRate', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Create or update exchange rate for a day' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Exchange rate saved successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [set_daily_exchange_rate_dto_1.SetDailyExchangeRateDto, Object]),
    __metadata("design:returntype", void 0)
], ExchangeRateController.prototype, "setDailyRate", null);
__decorate([
    (0, common_1.Get)('daily'),
    (0, require_permissions_decorator_1.RequirePermission)('ExchangeRate', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Get exchange rate for a specific day or today' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, type: String, example: '2026-04-28' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Exchange rate found or null if not configured for the day' }),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ExchangeRateController.prototype, "getDailyRate", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermission)('ExchangeRate', 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'List exchange rate history' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Exchange rates list' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_exchange_rate_dto_1.QueryExchangeRateDto, Object]),
    __metadata("design:returntype", void 0)
], ExchangeRateController.prototype, "findAll", null);
exports.ExchangeRateController = ExchangeRateController = __decorate([
    (0, swagger_1.ApiTags)('Exchange Rates'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/exchange-rates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [exchange_rate_service_1.ExchangeRateService])
], ExchangeRateController);
//# sourceMappingURL=exchange-rate.controller.js.map