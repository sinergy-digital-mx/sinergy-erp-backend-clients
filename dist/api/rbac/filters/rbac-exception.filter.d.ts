import { ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
import { RBACException } from '../errors/rbac-exceptions';
import { RBACErrorHandlerService } from '../errors/error-handler.service';
export declare class RBACExceptionFilter implements ExceptionFilter {
    private readonly errorHandler;
    private readonly logger;
    constructor(errorHandler: RBACErrorHandlerService);
    catch(exception: RBACException | HttpException, host: ArgumentsHost): void;
    private generateCorrelationId;
}
