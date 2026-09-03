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
var JwtAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const permission_version_service_1 = require("../rbac/services/permission-version.service");
let JwtAuthGuard = JwtAuthGuard_1 = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    permissionVersionService;
    logger = new common_1.Logger(JwtAuthGuard_1.name);
    constructor(permissionVersionService) {
        super();
        this.permissionVersionService = permissionVersionService;
    }
    async canActivate(context) {
        const isAuthenticated = await super.canActivate(context);
        if (!isAuthenticated) {
            return false;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const url = request.url;
        if (url.includes('/auth/refresh')) {
            this.logger.debug('Skipping permission version check for /auth/refresh endpoint');
            return true;
        }
        if (!user || user.permissions_version === undefined || user.permissions_version === null) {
            return true;
        }
        if (!this.permissionVersionService) {
            return true;
        }
        try {
            const dbVersion = await this.permissionVersionService.getUserVersion(user.id);
            this.logger.debug(`Permission version check for user ${user.id}: JWT=${user.permissions_version}, DB=${dbVersion}`);
            if (user.permissions_version < dbVersion) {
                this.logger.warn(`Permission version mismatch for user ${user.id}: JWT version ${user.permissions_version} < DB version ${dbVersion}`);
                throw new common_1.UnauthorizedException({
                    statusCode: 401,
                    message: 'Your permissions have been updated. Please refresh your session.',
                    error: 'PERMISSIONS_CHANGED',
                });
            }
            return true;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            this.logger.error('Error checking permission version:', error);
            return true;
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = JwtAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [permission_version_service_1.PermissionVersionService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map