/**
 * RBAC Error Handler Service
 * 
 * Centralized service for handling, logging, and formatting RBAC errors.
 * Provides consistent error processing and response formatting.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import {
  RBACErrorCode,
  RBACErrorCategory,
  RBACErrorSeverity,
  RBACErrorDetails,
} from './rbac-error.types';
import {
  RBACErrorResponse,
  RBACSimpleErrorResponse,
  RBACDebugErrorResponse,
} from './error-response.interface';
import { RBACException } from './rbac-exceptions';
import { getErrorMessage, getUserFriendlyMessage } from './error-messages';

/**
 * Configuration for error handling behavior
 */
export interface ErrorHandlerConfig {
  /** Whether to include stack traces in responses (development only) */
  includeStackTrace: boolean;
  
  /** Whether to include request details in error responses */
  includeRequestDetails: boolean;
  
  /** Whether to log errors to external monitoring systems */
  enableExternalLogging: boolean;
  
  /** Whether to use simplified error responses for production */
  useSimplifiedResponses: boolean;
  
  /** Maximum length for error messages */
  maxMessageLength: number;
}

@Injectable()
export class RBACErrorHandlerService {
  private readonly logger = new Logger(RBACErrorHandlerService.name);
  private readonly config: ErrorHandlerConfig;
  
  constructor() {
    this.config = {
      includeStackTrace: process.env.NODE_ENV === 'development',
      includeRequestDetails: process.env.NODE_ENV === 'development',
      enableExternalLogging: true,
      useSimplifiedResponses: process.env.NODE_ENV === 'production',
      maxMessageLength: 500,
    };
  }

  /**
   * Handle and format an RBAC exception
   */
  handleException(
    exception: RBACException,
    request: Request,
    correlationId?: string,
  ): RBACErrorResponse | RBACSimpleErrorResponse {
    // Log the error
    this.logError(exception, request, correlationId);

    // Generate correlation ID if not provided
    const finalCorrelationId = correlationId || this.generateCorrelationId();

    // Create error response based on configuration
    if (this.config.useSimplifiedResponses) {
      return this.createSimpleErrorResponse(exception, request, finalCorrelationId);
    }

    return this.createDetailedErrorResponse(exception, request, finalCorrelationId);
  }

  /**
   * Handle generic errors and convert them to RBAC exceptions
   */
  handleGenericError(
    error: Error,
    request: Request,
    correlationId?: string,
  ): RBACErrorResponse | RBACSimpleErrorResponse {
    // Convert generic error to RBAC exception
    const rbacException = this.convertToRBACException(error);
    
    return this.handleException(rbacException, request, correlationId);
  }

  /**
   * Create a detailed error response with full context
   */
  private createDetailedErrorResponse(
    exception: RBACException,
    request: Request,
    correlationId: string,
  ): RBACErrorResponse | RBACDebugErrorResponse {
    const errorMessage = getErrorMessage(exception.code);
    
    const baseResponse: RBACErrorResponse = {
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

    // Add debug information in development
    if (this.config.includeStackTrace || this.config.includeRequestDetails) {
      const debugResponse: RBACDebugErrorResponse = {
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

  /**
   * Create a simplified error response for production
   */
  private createSimpleErrorResponse(
    exception: RBACException,
    request: Request,
    correlationId: string,
  ): RBACSimpleErrorResponse {
    return {
      statusCode: exception.getStatus(),
      error: exception.name,
      message: this.truncateMessage(getUserFriendlyMessage(exception.code)),
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  /**
   * Convert generic errors to RBAC exceptions
   */
  private convertToRBACException(error: Error): RBACException {
    // If it's already an RBAC exception, return as-is
    if (error instanceof RBACException) {
      return error;
    }

    // Map common NestJS exceptions to RBAC exceptions
    const { RBACSystemException } = require('./rbac-exceptions');
    
    return new RBACSystemException(
      RBACErrorCode.INTERNAL_SERVER_ERROR,
      {
        originalError: error.message,
        stackTrace: error.stack,
      },
    );
  }

  /**
   * Log error with appropriate level based on severity
   */
  private logError(
    exception: RBACException,
    request: Request,
    correlationId?: string,
  ): void {
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
      case RBACErrorSeverity.CRITICAL:
        this.logger.error(message, exception.stack, logContext);
        break;
      case RBACErrorSeverity.HIGH:
        this.logger.error(message, logContext);
        break;
      case RBACErrorSeverity.MEDIUM:
        this.logger.warn(message, logContext);
        break;
      case RBACErrorSeverity.LOW:
        this.logger.log(message, logContext);
        break;
      default:
        this.logger.log(message, logContext);
    }

    // Send to external monitoring if enabled
    if (this.config.enableExternalLogging) {
      this.sendToExternalMonitoring(exception, request, logContext);
    }
  }

  /**
   * Send error to external monitoring systems
   */
  private sendToExternalMonitoring(
    exception: RBACException,
    request: Request,
    context: any,
  ): void {
    // Implementation would depend on your monitoring system
    // Examples: Sentry, DataDog, New Relic, etc.
    
    // For now, just log that we would send to external monitoring
    if (exception.severity === RBACErrorSeverity.CRITICAL || 
        exception.severity === RBACErrorSeverity.HIGH) {
      this.logger.debug('Would send to external monitoring', {
        exception: exception.code,
        context,
      });
    }
  }

  /**
   * Generate a unique correlation ID for tracking
   */
  private generateCorrelationId(): string {
    return `rbac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Truncate error messages to prevent overly long responses
   */
  private truncateMessage(message: string): string {
    if (message.length <= this.config.maxMessageLength) {
      return message;
    }
    
    return message.substring(0, this.config.maxMessageLength - 3) + '...';
  }

  /**
   * Sanitize context data to remove sensitive information
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request headers to remove sensitive information
   */
  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized = { ...headers };
    
    // Remove or mask sensitive headers
    if (sanitized.authorization) {
      sanitized.authorization = '[REDACTED]';
    }
    
    if (sanitized.cookie) {
      sanitized.cookie = '[REDACTED]';
    }

    return sanitized;
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Extract user ID from request
   */
  private extractUserId(request: Request): string | undefined {
    return (request as any).user?.user_id || (request as any).user?.id;
  }

  /**
   * Extract tenant ID from request
   */
  private extractTenantId(request: Request): string | undefined {
    return request.headers['x-tenant-id'] as string || 
           (request as any).user?.tenant_id;
  }

  /**
   * Create error details for audit logging
   */
  createAuditLogEntry(
    exception: RBACException,
    request: Request,
    correlationId: string,
  ): RBACErrorDetails {
    return {
      code: exception.code,
      category: exception.category,
      severity: exception.severity,
      message: exception.message,
      userMessage: getUserFriendlyMessage(exception.code),
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
      suggestions: getErrorMessage(exception.code).suggestions,
      timestamp: new Date(),
    };
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: Record<RBACErrorCategory, number>;
    errorsBySeverity: Record<RBACErrorSeverity, number>;
    recentErrors: Array<{
      code: RBACErrorCode;
      timestamp: Date;
      count: number;
    }>;
  } {
    // This would typically be implemented with a proper metrics store
    // For now, return a placeholder structure
    return {
      totalErrors: 0,
      errorsByCategory: {} as Record<RBACErrorCategory, number>,
      errorsBySeverity: {} as Record<RBACErrorSeverity, number>,
      recentErrors: [],
    };
  }
}