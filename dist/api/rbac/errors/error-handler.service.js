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
var RBACErrorHandlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACErrorHandlerService = void 0;
const common_1 = require("@nestjs/common");
const rbac_error_types_1 = require("./rbac-error.types");
const rbac_exceptions_1 = require("./rbac-exceptions");
const error_messages_1 = require("./error-messages");
let RBACErrorHandlerService = RBACErrorHandlerService_1 = class RBACErrorHandlerService {
    logger = new common_1.Logger(RBACErrorHandlerService_1.name);
    config;
    constructor() {
        this.config = {
            includeStackTrace: process.env.NODE_ENV === 'development',
            includeRequestDetails: process.env.NODE_ENV === 'development',
            enableExternalLogging: true,
            useSimplifiedResponses: process.env.NODE_ENV === 'production',
            maxMessageLength: 500,
        };
    }
    handleException(exception, request, correlationId) {
        this.logError(exception, request, correlationId);
        const finalCorrelationId = correlationId || this.generateCorrelationId();
        if (this.config.useSimplifiedResponses) {
            return this.createSimpleErrorResponse(exception, request, finalCorrelationId);
        }
        return this.createDetailedErrorResponse(exception, request, finalCorrelationId);
    }
    handleGenericError(error, request, correlationId) {
        const rbacException = this.convertToRBACException(error);
        return this.handleException(rbacException, request, correlationId);
    }
    createDetailedErrorResponse(exception, request, correlationId) {
        const errorMessage = (0, error_messages_1.getErrorMessage)(exception.code);
        const baseResponse = {
            statusCode: exception.getStatus(),
            error: exception.name,
            message: this.truncateMessage(errorMessage.technical),
            code: exception.code,
            category: exception.category,
            severity: exception.severity,
            suggestions: errorMessage.suggestions,
            timestamp: new Date().toISOString(),
            path: request.url,
            correlationId,
            details: this.sanitizeContext(exception.context),
        };
        if (this.config.includeStackTrace || this.config.includeRequestDetails) {
            const debugResponse = {
                ...baseResponse,
            };
            if (this.config.includeStackTrace) {
                debugResponse.stackTrace = exception.stack;
            }
            if (this.config.includeRequestDetails) {
                debugResponse.requestDetails = {
                    method: request.method,
                    headers: this.sanitizeHeaders(request.headers),
                    query: request.query,
                    body: this.sanitizeBody(request.body),
                };
            }
            return debugResponse;
        }
        return baseResponse;
    }
    createSimpleErrorResponse(exception, request, correlationId) {
        return {
            statusCode: exception.getStatus(),
            error: exception.name,
            message: this.truncateMessage((0, error_messages_1.getUserFriendlyMessage)(exception.code)),
            timestamp: new Date().toISOString(),
            path: request.url,
        };
    }
    convertToRBACException(error) {
        if (error instanceof rbac_exceptions_1.RBACException) {
            return error;
        }
        const { RBACSystemException } = require('./rbac-exceptions');
        return new RBACSystemException(rbac_error_types_1.RBACErrorCode.INTERNAL_SERVER_ERROR, {
            originalError: error.message,
            stackTrace: error.stack,
        });
    }
    logError(exception, request, correlationId) {
        const logContext = {
            correlationId,
            code: exception.code,
            category: exception.category,
            severity: exception.severity,
            path: request.url,
            method: request.method,
            userId: this.extractUserId(request),
            tenantId: this.extractTenantId(request),
            userAgent: request.headers['user-agent'],
            ip: request.ip,
        };
        const message = `RBAC Error: ${exception.code} - ${exception.message}`;
        switch (exception.severity) {
            case rbac_error_types_1.RBACErrorSeverity.CRITICAL:
                this.logger.error(message, exception.stack, logContext);
                break;
            case rbac_error_types_1.RBACErrorSeverity.HIGH:
                this.logger.error(message, logContext);
                break;
            case rbac_error_types_1.RBACErrorSeverity.MEDIUM:
                this.logger.warn(message, logContext);
                break;
            case rbac_error_types_1.RBACErrorSeverity.LOW:
                this.logger.log(message, logContext);
                break;
            default:
                this.logger.log(message, logContext);
        }
        if (this.config.enableExternalLogging) {
            this.sendToExternalMonitoring(exception, request, logContext);
        }
    }
    sendToExternalMonitoring(exception, request, context) {
        if (exception.severity === rbac_error_types_1.RBACErrorSeverity.CRITICAL ||
            exception.severity === rbac_error_types_1.RBACErrorSeverity.HIGH) {
            this.logger.debug('Would send to external monitoring', {
                exception: exception.code,
                context,
            });
        }
    }
    generateCorrelationId() {
        return `rbac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    truncateMessage(message) {
        if (message.length <= this.config.maxMessageLength) {
            return message;
        }
        return message.substring(0, this.config.maxMessageLength - 3) + '...';
    }
    sanitizeContext(context) {
        if (!context)
            return undefined;
        const sanitized = { ...context };
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }
        return sanitized;
    }
    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        if (sanitized.authorization) {
            sanitized.authorization = '[REDACTED]';
        }
        if (sanitized.cookie) {
            sanitized.cookie = '[REDACTED]';
        }
        return sanitized;
    }
    sanitizeBody(body) {
        if (!body || typeof body !== 'object') {
            return body;
        }
        const sanitized = { ...body };
        const sensitiveFields = ['password', 'token', 'secret', 'key'];
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }
        return sanitized;
    }
    extractUserId(request) {
        return request.user?.user_id || request.user?.id;
    }
    extractTenantId(request) {
        return request.headers['x-tenant-id'] ||
            request.user?.tenant_id;
    }
    createAuditLogEntry(exception, request, correlationId) {
        return {
            code: exception.code,
            category: exception.category,
            severity: exception.severity,
            message: exception.message,
            userMessage: (0, error_messages_1.getUserFriendlyMessage)(exception.code),
            context: {
                ...exception.context,
                correlationId,
                path: request.url,
                method: request.method,
                userId: this.extractUserId(request),
                tenantId: this.extractTenantId(request),
                userAgent: request.headers['user-agent'],
                ip: request.ip,
            },
            suggestions: (0, error_messages_1.getErrorMessage)(exception.code).suggestions,
            timestamp: new Date(),
        };
    }
    getErrorStatistics() {
        return {
            totalErrors: 0,
            errorsByCategory: {},
            errorsBySeverity: {},
            recentErrors: [],
        };
    }
};
exports.RBACErrorHandlerService = RBACErrorHandlerService;
exports.RBACErrorHandlerService = RBACErrorHandlerService = RBACErrorHandlerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RBACErrorHandlerService);
//# sourceMappingURL=error-handler.service.js.map