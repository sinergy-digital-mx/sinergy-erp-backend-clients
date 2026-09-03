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
exports.ReceiptController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const tenant_module_validation_guard_1 = require("../../auth/tenant-module-validation.guard");
const receipt_service_1 = require("../services/receipt.service");
const dto_1 = require("../dto");
let ReceiptController = class ReceiptController {
    receiptService;
    constructor(receiptService) {
        this.receiptService = receiptService;
    }
    async receive(id, dto, req) {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        return this.receiptService.receive(id, dto, tenantId, userId);
    }
};
exports.ReceiptController = ReceiptController;
__decorate([
    (0, common_1.Post)(':id/receipt'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ReceivePurchaseOrderDto, Object]),
    __metadata("design:returntype", Promise)
], ReceiptController.prototype, "receive", null);
exports.ReceiptController = ReceiptController = __decorate([
    (0, common_1.Controller)('tenant/purchase-orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_module_validation_guard_1.TenantModuleValidationGuard),
    __metadata("design:paramtypes", [receipt_service_1.ReceiptService])
], ReceiptController);
//# sourceMappingURL=receipt.controller.js.map