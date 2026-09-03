import { Request } from 'express';
import { RBACErrorCode, RBACErrorCategory, RBACErrorSeverity, RBACErrorDetails } from './rbac-error.types';
import { RBACErrorResponse, RBACSimpleErrorResponse } from './error-response.interface';
import { RBACException } from './rbac-exceptions';
export interface ErrorHandlerConfig {
    includeStackTrace: boolean;
    includeRequestDetails: boolean;
    enableExternalLogging: boolean;
    useSimplifiedResponses: boolean;
    maxMessageLength: number;
}
export declare class RBACErrorHandlerService {
    private readonly logger;
    private readonly config;
    constructor();
    handleException(exception: RBACException, request: Request, correlationId?: string): RBACErrorResponse | RBACSimpleErrorResponse;
    handleGenericError(error: Error, request: Request, correlationId?: string): RBACErrorResponse | RBACSimpleErrorResponse;
    private createDetailedErrorResponse;
    private createSimpleErrorResponse;
    private convertToRBACException;
    private logError;
    private sendToExternalMonitoring;
    private generateCorrelationId;
    private truncateMessage;
    private sanitizeContext;
    private sanitizeHeaders;
    private sanitizeBody;
    private extractUserId;
    private extractTenantId;
    createAuditLogEntry(exception: RBACException, request: Request, correlationId: string): RBACErrorDetails;
    getErrorStatistics(): {
        totalErrors: number;
        errorsByCategory: Record<RBACErrorCategory, number>;
        errorsBySeverity: Record<RBACErrorSeverity, number>;
        recentErrors: Array<{
            code: RBACErrorCode;
            timestamp: Date;
            count: number;
        }>;
    };
}
