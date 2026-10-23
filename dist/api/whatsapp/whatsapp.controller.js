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
exports.WhatsappController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const tenant_context_service_1 = require("../rbac/services/tenant-context.service");
const whatsapp_dto_1 = require("./dto/whatsapp.dto");
const whatsapp_message_service_1 = require("./services/whatsapp-message.service");
const whatsapp_session_service_1 = require("./services/whatsapp-session.service");
const whatsapp_constants_1 = require("./whatsapp.constants");
let WhatsappController = class WhatsappController {
    sessions;
    messages;
    tenantContext;
    constructor(sessions, messages, tenantContext) {
        this.sessions = sessions;
        this.messages = messages;
        this.tenantContext = tenantContext;
    }
    status() {
        return this.sessions.getStatus(this.tenantId());
    }
    connect() {
        return this.sessions.connect(this.tenantId(), this.userId());
    }
    qr() {
        return this.sessions.qr(this.tenantId());
    }
    pairingCode(dto) {
        return this.sessions.pairingCode(this.tenantId(), dto.phone);
    }
    restart() {
        return this.sessions.restart(this.tenantId(), this.userId());
    }
    logout() {
        return this.sessions.logout(this.tenantId(), this.userId());
    }
    async remove() {
        await this.sessions.remove(this.tenantId());
        return { ok: true };
    }
    groups() {
        return this.sessions.listGroups(this.tenantId());
    }
    sendText(dto) {
        return this.messages.sendText(this.tenantId(), this.userId(), dto);
    }
    sendFile(dto) {
        return this.messages.sendFile(this.tenantId(), this.userId(), dto);
    }
    list(query) {
        return this.messages.list(this.tenantId(), query);
    }
    findOne(id) {
        return this.messages.findOne(this.tenantId(), id);
    }
    tenantId() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId)
            throw new Error('Se requiere el contexto de la organización');
        return tenantId;
    }
    userId() {
        const userId = this.tenantContext.getCurrentUserId();
        if (!userId)
            throw new Error('Se requiere el contexto de la organización');
        return userId;
    }
};
exports.WhatsappController = WhatsappController;
__decorate([
    (0, common_1.Get)('session'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: whatsapp_constants_1.WHATSAPP_ENTITY_CODE, action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Estado de la conexión de WhatsApp' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "status", null);
__decorate([
    (0, common_1.Post)('session/connect'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: whatsapp_constants_1.WHATSAPP_ENTITY_CODE, action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Iniciar la conexión (genera el QR si hace falta)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "connect", null);
__decorate([
    (0, common_1.Get)('session/qr'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: whatsapp_constants_1.WHATSAPP_ENTITY_CODE, action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'QR vigente para vincular el teléfono' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "qr", null);
__decorate([
    (0, common_1.Post)('session/pairing-code'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: whatsapp_constants_1.WHATSAPP_ENTITY_CODE, action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Código para vincular con número de teléfono (alternativa al QR)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [whatsapp_dto_1.WhatsappPairingCodeDto]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "pairingCode", null);
__decorate([
    (0, common_1.Post)('session/restart'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: whatsapp_constants_1.WHATSAPP_ENTITY_CODE, action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Reiniciar la sesión de WhatsApp' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "restart", null);
__decorate([
    (0, common_1.Post)('session/logout'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: whatsapp_constants_1.WHATSAPP_ENTITY_CODE, action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Desvincular el teléfono' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "logout", null);
__decorate([
    (0, common_1.Delete)('session'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: whatsapp_constants_1.WHATSAPP_ENTITY_CODE, action: 'Delete' }),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar la conexión de WhatsApp' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('groups'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: whatsapp_constants_1.WHATSAPP_ENTITY_CODE, action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Grupos de WhatsApp de la sesión conectada' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "groups", null);
__decorate([
    (0, common_1.Post)('messages/text'),
    (0, common_1.HttpCode)(202),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: whatsapp_constants_1.WHATSAPP_ENTITY_CODE, action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar un mensaje de texto (entra a la cola de envío)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [whatsapp_dto_1.SendWhatsappTextDto]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "sendText", null);
__decorate([
    (0, common_1.Post)('messages/file'),
    (0, common_1.HttpCode)(202),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: whatsapp_constants_1.WHATSAPP_ENTITY_CODE, action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar un archivo por URL https (entra a la cola de envío)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [whatsapp_dto_1.SendWhatsappFileDto]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "sendFile", null);
__decorate([
    (0, common_1.Get)('messages'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: whatsapp_constants_1.WHATSAPP_ENTITY_CODE, action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Historial de mensajes enviados' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [whatsapp_dto_1.QueryWhatsappMessagesDto]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('messages/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: whatsapp_constants_1.WHATSAPP_ENTITY_CODE, action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Detalle y estado de un mensaje' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "findOne", null);
exports.WhatsappController = WhatsappController = __decorate([
    (0, swagger_1.ApiTags)('WhatsApp'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/whatsapp'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [whatsapp_session_service_1.WhatsappSessionService,
        whatsapp_message_service_1.WhatsappMessageService,
        tenant_context_service_1.TenantContextService])
], WhatsappController);
//# sourceMappingURL=whatsapp.controller.js.map