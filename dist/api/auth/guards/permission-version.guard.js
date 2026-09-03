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
var PermissionVersionGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionVersionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permission_version_service_1 = require("../../rbac/services/permission-version.service");
let PermissionVersionGuard = PermissionVersionGuard_1 = class PermissionVersionGuard {
    permissionVersionService;
    reflector;
    logger = new common_1.Logger(PermissionVersionGuard_1.name);
    constructor(permissionVersionService, reflector) {
        this.permissionVersionService = permissionVersionService;
        this.reflector = reflector;
    }
    async canActivate(context) {
        try {
            const request = context.switchToHttp().getRequest();
            const user = request.user;
            if (!user || !user.id) {
                this.logger.debug('No user in request, skipping permission version check');
                return true;
            }
            const url = request.url;
            if (url.includes('/auth/refresh')) {
                this.logger.debug('Skipping permission version check for /auth/refresh endpoint');
                return true;
            }
            const jwtVersion = user.permissions_version;
            if (jwtVersion === undefined || jwtVersion === null) {
                this.logger.warn(`JWT for user ${user.id} does not contain permissions_version`);
                return true;
            }
            const dbVersion = await this.permissionVersionService.getUserVersion(user.id);
            this.logger.debug(`Permission version check for user ${user.id}: JWT=${jwtVersion}, DB=${dbVersion}`);
            if (jwtVersion < dbVersion) {
                this.logger.warn(`Permission version mismatch for user ${user.id}: JWT version ${jwtVersion} < DB version ${dbVersion}`);
                throw new common_1.UnauthorizedException({
                    statusCode: 401,
                    message: 'Your permissions have been updated. Please refresh your session.',
                    error: 'PERMISSIONS_CHANGED',
                });
            }
            this.logger.debug(`Permission version check passed for user ${user.id}: version ${jwtVersion}`);
            return true;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            this.logger.error('Error in PermissionVersionGuard:', error);
            return true;
        }
    }
};
exports.PermissionVersionGuard = PermissionVersionGuard;
exports.PermissionVersionGuard = PermissionVersionGuard = PermissionVersionGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [permission_version_service_1.PermissionVersionService,
        core_1.Reflector])
], PermissionVersionGuard);
//# sourceMappingURL=permission-version.guard.js.map