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
var RBACExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const rbac_exceptions_1 = require("../errors/rbac-exceptions");
const error_handler_service_1 = require("../errors/error-handler.service");
let RBACExceptionFilter = RBACExceptionFilter_1 = class RBACExceptionFilter {
    errorHandler;
    logger = new common_1.Logger(RBACExceptionFilter_1.name);
    constructor(errorHandler) {
        this.errorHandler = errorHandler;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const correlationId = this.generateCorrelationId();
        let errorResponse;
        if (exception instanceof rbac_exceptions_1.RBACException) {
            errorResponse = this.errorHandler.handleException(exception, request, correlationId);
        }
        else {
            errorResponse = this.errorHandler.handleGenericError(exception, request, correlationId);
        }
        response.setHeader('X-Correlation-ID', correlationId);
        response.status(errorResponse.statusCode).json(errorResponse);
    }
    generateCorrelationId() {
        return `rbac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.RBACExceptionFilter = RBACExceptionFilter;
exports.RBACExceptionFilter = RBACExceptionFilter = RBACExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(rbac_exceptions_1.RBACException, common_1.HttpException),
    __metadata("design:paramtypes", [error_handler_service_1.RBACErrorHandlerService])
], RBACExceptionFilter);
//# sourceMappingURL=rbac-exception.filter.js.map