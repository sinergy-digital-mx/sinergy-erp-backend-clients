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
exports.ServiceSubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const service_subscription_constants_1 = require("./service-subscription.constants");
const service_subscriptions_service_1 = require("./service-subscriptions.service");
const create_service_subscription_dto_1 = require("./dto/create-service-subscription.dto");
const update_service_subscription_dto_1 = require("./dto/update-service-subscription.dto");
const query_service_subscription_dto_1 = require("./dto/query-service-subscription.dto");
const link_service_subscription_period_dto_1 = require("./dto/link-service-subscription-period.dto");
const renew_service_subscription_dto_1 = require("./dto/renew-service-subscription.dto");
let ServiceSubscriptionsController = class ServiceSubscriptionsController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(query, req) {
        return this.service.list(req.user.tenant_id, query);
    }
    create(dto, req) {
        return this.service.create(req.user.tenant_id, req.user.id, dto);
    }
    bySalesOrder(salesOrderId, req) {
        return this.service.findBySalesOrder(req.user.tenant_id, salesOrderId);
    }
    summaryEmail(id, body, req) {
        return this.service.sendSummaryEmail(req.user.tenant_id, id, body?.to_email);
    }
    getOne(id, req) {
        return this.service.getOne(req.user.tenant_id, id);
    }
    update(id, dto, req) {
        return this.service.update(req.user.tenant_id, id, dto);
    }
    cancel(id, req) {
        return this.service.cancel(req.user.tenant_id, id);
    }
    renew(id, dto, req) {
        return this.service.renew(req.user.tenant_id, req.user.id, id, dto);
    }
    generate(id, periodId, req) {
        return this.service.generate(req.user.tenant_id, req.user.id, id, periodId);
    }
    invoice(id, periodId, req) {
        return this.service.invoice(req.user.tenant_id, req.user.id, id, periodId);
    }
    link(id, periodId, dto, req) {
        return this.service.link(req.user.tenant_id, id, periodId, dto);
    }
    skip(id, periodId, req) {
        return this.service.skip(req.user.tenant_id, id, periodId);
    }
    unlink(id, periodId, req) {
        return this.service.unlink(req.user.tenant_id, id, periodId);
    }
};
exports.ServiceSubscriptionsController = ServiceSubscriptionsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: service_subscription_constants_1.SERVICE_SUBSCRIPTION_ENTITY, action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Listar suscripciones de servicio' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_service_subscription_dto_1.QueryServiceSubscriptionDto, Object]),
    __metadata("design:returntype", void 0)
], ServiceSubscriptionsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: service_subscription_constants_1.SERVICE_SUBSCRIPTION_ENTITY, action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Crear suscripción de servicio' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_service_subscription_dto_1.CreateServiceSubscriptionDto, Object]),
    __metadata("design:returntype", void 0)
], ServiceSubscriptionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('by-sales-order/:salesOrderId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: service_subscription_constants_1.SERVICE_SUBSCRIPTION_ENTITY, action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Suscripción ligada a una orden de venta' }),
    __param(0, (0, common_1.Param)('salesOrderId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ServiceSubscriptionsController.prototype, "bySalesOrder", null);
__decorate([
    (0, common_1.Post)(':id/summary-email'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: service_subscription_constants_1.SERVICE_SUBSCRIPTION_ENTITY, action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar por correo el resumen del servicio y el detalle de cada mes' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ServiceSubscriptionsController.prototype, "summaryEmail", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: service_subscription_constants_1.SERVICE_SUBSCRIPTION_ENTITY, action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle de la suscripción y sus meses' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ServiceSubscriptionsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: service_subscription_constants_1.SERVICE_SUBSCRIPTION_ENTITY, action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar datos de la suscripción' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_service_subscription_dto_1.UpdateServiceSubscriptionDto, Object]),
    __metadata("design:returntype", void 0)
], ServiceSubscriptionsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: service_subscription_constants_1.SERVICE_SUBSCRIPTION_ENTITY, action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar la suscripción' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ServiceSubscriptionsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/renew'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: service_subscription_constants_1.SERVICE_SUBSCRIPTION_ENTITY, action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Renovar la suscripción por otro plazo' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, renew_service_subscription_dto_1.RenewServiceSubscriptionDto, Object]),
    __metadata("design:returntype", void 0)
], ServiceSubscriptionsController.prototype, "renew", null);
__decorate([
    (0, common_1.Post)(':id/periods/:periodId/generate'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: service_subscription_constants_1.SERVICE_SUBSCRIPTION_ENTITY, action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Generar la orden de venta del mes y facturar si es el mes actual' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('periodId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ServiceSubscriptionsController.prototype, "generate", null);
__decorate([
    (0, common_1.Post)(':id/periods/:periodId/invoice'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: service_subscription_constants_1.SERVICE_SUBSCRIPTION_ENTITY, action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Timbrar la factura de la orden ya ligada a ese mes' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('periodId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ServiceSubscriptionsController.prototype, "invoice", null);
__decorate([
    (0, common_1.Post)(':id/periods/:periodId/link'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: service_subscription_constants_1.SERVICE_SUBSCRIPTION_ENTITY, action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Vincular una orden existente a ese mes' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('periodId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, link_service_subscription_period_dto_1.LinkServiceSubscriptionPeriodDto, Object]),
    __metadata("design:returntype", void 0)
], ServiceSubscriptionsController.prototype, "link", null);
__decorate([
    (0, common_1.Post)(':id/periods/:periodId/skip'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: service_subscription_constants_1.SERVICE_SUBSCRIPTION_ENTITY, action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Omitir el mes' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('periodId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ServiceSubscriptionsController.prototype, "skip", null);
__decorate([
    (0, common_1.Post)(':id/periods/:periodId/unlink'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: service_subscription_constants_1.SERVICE_SUBSCRIPTION_ENTITY, action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Quitar la orden de ese mes' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('periodId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ServiceSubscriptionsController.prototype, "unlink", null);
exports.ServiceSubscriptionsController = ServiceSubscriptionsController = __decorate([
    (0, swagger_1.ApiTags)('Service subscriptions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, common_1.Controller)('tenant/service-subscriptions'),
    __metadata("design:paramtypes", [service_subscriptions_service_1.ServiceSubscriptionsService])
], ServiceSubscriptionsController);
//# sourceMappingURL=service-subscriptions.controller.js.map