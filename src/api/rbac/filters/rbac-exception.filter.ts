/**
 * RBAC Exception Filter
 * 
 * Global exception filter that catches and formats RBAC exceptions
 * with consistent error responses and proper logging.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RBACException } from '../errors/rbac-exceptions';
import { RBACErrorHandlerService } from '../errors/error-handler.service';

@Catch(RBACException, HttpException)
export class RBACExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RBACExceptionFilter.name);

  constructor(private readonly errorHandler: RBACErrorHandlerService) {}

  catch(exception: RBACException | HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate correlation ID for tracking
    const correlationId = this.generateCorrelationId();

    let errorResponse;

    if (exception instanceof RBACException) {
      // Handle RBAC-specific exceptions
      errorResponse = this.errorHandler.handleException(
        exception,
        request,
        correlationId,
      );
    } else {
      // Handle generic HTTP exceptions
      errorResponse = this.errorHandler.handleGenericError(
        exception,
        request,
        correlationId,
      );
    }

    // Set correlation ID header for client tracking
    response.setHeader('X-Correlation-ID', correlationId);

    // Send the formatted error response
    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private generateCorrelationId(): string {
    return `rbac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}