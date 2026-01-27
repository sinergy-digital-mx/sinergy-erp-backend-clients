# RBAC Error Handling System

This comprehensive error handling system provides standardized error types, response formats, and descriptive error messages for the Role-Based Access Control (RBAC) module.

## Features

- **Standardized Error Types**: Consistent error classifications and codes
- **Descriptive Error Messages**: Both technical and user-friendly messages
- **Comprehensive Context**: Detailed error context for debugging and auditing
- **Automatic Error Handling**: Guards and filters for seamless integration
- **Security-Aware**: Sensitive information sanitization
- **Monitoring Ready**: Built-in logging and correlation tracking

## Architecture

### Error Classification

The system classifies errors into the following categories:

- **AUTHENTICATION** (401): Missing or invalid authentication
- **AUTHORIZATION** (403): Insufficient permissions or access denied
- **VALIDATION** (400): Invalid input data or malformed requests
- **SYSTEM** (500): Internal server errors and service failures
- **TENANT**: Tenant-related errors
- **ROLE**: Role management errors
- **PERMISSION**: Permission-related errors
- **CACHE**: Cache service errors

### Error Codes

Each error has a specific code for precise identification:

```typescript
// Authentication Errors
AUTH_TOKEN_MISSING
AUTH_TOKEN_INVALID
AUTH_TOKEN_EXPIRED
AUTH_USER_NOT_FOUND
AUTH_CONTEXT_REQUIRED

// Authorization Errors
PERMISSION_DENIED
CROSS_TENANT_ACCESS_DENIED
CROSS_USER_ACCESS_DENIED
INSUFFICIENT_PERMISSIONS
ROLE_ACCESS_DENIED

// Validation Errors
INVALID_ENTITY_TYPE
INVALID_ACTION_TYPE
INVALID_ROLE_DATA
INVALID_PERMISSION_DATA
MALFORMED_REQUEST

// System Errors
DATABASE_CONNECTION_FAILED
CACHE_SERVICE_UNAVAILABLE
ENTITY_REGISTRY_UNAVAILABLE
INTERNAL_SERVER_ERROR
MIGRATION_FAILED
```

## Usage

### Basic Exception Throwing

```typescript
import { RBACErrorUtils } from './errors';

// Throw permission denied error
RBACErrorUtils.throwPermissionDenied('Customer', 'Delete', userId, tenantId);

// Throw invalid entity type error
RBACErrorUtils.throwInvalidEntityType('InvalidEntity', availableEntities);

// Throw authentication required error
RBACErrorUtils.throwAuthenticationRequired('Tenant context is required');
```

### Using Exception Factories

```typescript
import { 
  createPermissionDeniedException,
  createInvalidEntityTypeException,
  createRoleNotFoundException 
} from './errors';

// Create detailed permission denied exception
const exception = createPermissionDeniedException(
  'Customer',
  'Delete',
  userId,
  tenantId,
  userPermissions,
  correlationId
);

throw exception;
```

### Controller Integration

```typescript
import { Controller, UseFilters, UseGuards } from '@nestjs/common';
import { RBACExceptionFilter, PermissionGuard } from './rbac';

@Controller('api/customers')
@UseGuards(PermissionGuard)
@UseFilters(RBACExceptionFilter)
export class CustomersController {
  @Get()
  @RequirePermissions({ entityType: 'Customer', action: 'Read' })
  async getCustomers() {
    // Automatic error handling via PermissionGuard
    return this.customersService.findAll();
  }
}
```

### Service Integration

```typescript
import { Injectable } from '@nestjs/common';
import { RBACErrorUtils, HandleRBACErrors } from './errors';

@Injectable()
export class CustomersService {
  @HandleRBACErrors('CustomersService')
  async createCustomer(data: CreateCustomerDto) {
    // Automatic error wrapping
    return await this.repository.save(data);
  }

  async validateCustomerAccess(userId: string, customerId: string) {
    const hasAccess = await this.checkAccess(userId, customerId);
    
    if (!hasAccess) {
      RBACErrorUtils.throwPermissionDenied(
        'Customer',
        'Read',
        userId,
        this.getCurrentTenantId()
      );
    }
  }
}
```

### Manual Error Handling

```typescript
import { RBACErrorUtils, RBACErrorCode } from './errors';

try {
  await this.performOperation();
} catch (error) {
  if (RBACErrorUtils.isRBACException(error)) {
    // Handle RBAC-specific errors
    if (RBACErrorUtils.isErrorCode(error, RBACErrorCode.PERMISSION_DENIED)) {
      // Handle permission denied specifically
      return this.handlePermissionDenied(error);
    }
    
    // Re-throw RBAC exceptions
    throw error;
  }
  
  // Convert generic errors to RBAC system errors
  RBACErrorUtils.throwSystemError('ServiceName', 'operationName', error);
}
```

## Error Response Format

All RBAC errors follow a consistent response format:

```json
{
  "statusCode": 403,
  "error": "RBACAuthorizationException",
  "message": "User lacks the required permission for this action",
  "code": "PERMISSION_DENIED",
  "category": "AUTHORIZATION",
  "severity": "MEDIUM",
  "details": {
    "requiredPermission": {
      "entityType": "Customer",
      "action": "Delete"
    },
    "userId": "user-123",
    "tenantId": "tenant-456",
    "userPermissions": ["Customer:Read", "Customer:Update"]
  },
  "suggestions": [
    "Contact your administrator to request the necessary permissions",
    "Verify you're in the correct organization context",
    "Check if your role includes the required permissions"
  ],
  "timestamp": "2024-01-27T10:30:00.000Z",
  "path": "/api/customers/123",
  "correlationId": "rbac-1706356200000-abc123def"
}
```

## Configuration

### Error Handler Configuration

```typescript
import { RBACErrorHandlerService } from './errors';

const errorHandler = new RBACErrorHandlerService({
  includeStackTrace: process.env.NODE_ENV === 'development',
  includeRequestDetails: process.env.NODE_ENV === 'development',
  enableExternalLogging: true,
  useSimplifiedResponses: process.env.NODE_ENV === 'production',
  maxMessageLength: 500,
});
```

### Global Exception Filter

```typescript
import { APP_FILTER } from '@nestjs/core';
import { RBACExceptionFilter } from './rbac/errors';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: RBACExceptionFilter,
    },
  ],
})
export class AppModule {}
```

## Advanced Features

### Error Wrapping with Retry Logic

```typescript
import { RBACErrorUtils, isRetryableError, getRetryDelay } from './errors';

async function operationWithRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      
      if (isRetryableError(error) && attempt < maxAttempts) {
        const delay = getRetryDelay(error, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
}
```

### Bulk Operations with Partial Failures

```typescript
async function bulkCreateRoles(roles: CreateRoleDto[]) {
  const results = {
    successful: [],
    failed: [],
  };

  for (const roleData of roles) {
    try {
      const role = await this.roleService.createRole(roleData);
      results.successful.push(role);
    } catch (error) {
      const errorDetails = RBACErrorUtils.extractErrorDetails(error);
      results.failed.push({
        roleData,
        error: errorDetails,
      });
    }
  }

  return results;
}
```

### Custom Error Context

```typescript
import { RBACSystemException, RBACErrorCode } from './errors';

// Create exception with custom context
const exception = new RBACSystemException(
  RBACErrorCode.DATABASE_CONNECTION_FAILED,
  {
    service: 'UserService',
    operation: 'createUser',
    connectionPool: 'primary',
    retryAttempt: 3,
    lastError: originalError.message,
  },
  correlationId
);

throw exception;
```

## Monitoring and Logging

### Correlation Tracking

Every error includes a correlation ID for tracking across services:

```typescript
// Correlation IDs are automatically generated
const correlationId = 'rbac-1706356200000-abc123def';

// Use in logs and external monitoring
logger.error('Operation failed', { correlationId, userId, operation });
```

### Audit Logging

```typescript
import { RBACErrorHandlerService } from './errors';

const auditEntry = errorHandler.createAuditLogEntry(
  exception,
  request,
  correlationId
);

// Send to audit system
await this.auditService.logError(auditEntry);
```

### Error Statistics

```typescript
const stats = errorHandler.getErrorStatistics();
console.log('Error Statistics:', {
  totalErrors: stats.totalErrors,
  errorsByCategory: stats.errorsByCategory,
  errorsBySeverity: stats.errorsBySeverity,
});
```

## Testing

### Unit Testing Errors

```typescript
import { RBACErrorUtils, RBACErrorCode } from './errors';

describe('Error Handling', () => {
  it('should throw permission denied error', () => {
    expect(() => {
      RBACErrorUtils.throwPermissionDenied('Customer', 'Delete');
    }).toThrow(RBACAuthorizationException);
  });

  it('should identify RBAC exceptions', () => {
    const exception = new RBACValidationException(
      RBACErrorCode.INVALID_ENTITY_TYPE
    );
    
    expect(RBACErrorUtils.isRBACException(exception)).toBe(true);
    expect(RBACErrorUtils.isErrorCode(exception, RBACErrorCode.INVALID_ENTITY_TYPE)).toBe(true);
  });
});
```

### Integration Testing

```typescript
import { Test } from '@nestjs/testing';
import { RBACModule } from './rbac.module';

describe('RBAC Error Integration', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [RBACModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should return formatted error response', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/customers')
      .expect(403);

    expect(response.body).toMatchObject({
      statusCode: 403,
      code: 'PERMISSION_DENIED',
      category: 'AUTHORIZATION',
      suggestions: expect.arrayContaining([expect.any(String)]),
    });
  });
});
```

## Best Practices

### 1. Use Specific Error Codes

```typescript
// Good: Specific error code
RBACErrorUtils.throwInvalidEntityType('InvalidEntity', availableEntities);

// Bad: Generic error
throw new Error('Invalid entity');
```

### 2. Provide Context

```typescript
// Good: Rich context
RBACErrorUtils.throwPermissionDenied(
  'Customer',
  'Delete',
  userId,
  tenantId,
  userPermissions
);

// Bad: No context
RBACErrorUtils.throwPermissionDenied('Customer', 'Delete');
```

### 3. Handle Errors at the Right Level

```typescript
// Good: Handle at service level
@Injectable()
export class CustomerService {
  async deleteCustomer(id: string) {
    const customer = await this.findById(id);
    if (!customer) {
      RBACErrorUtils.throwRoleNotFound(id);
    }
    // ... rest of logic
  }
}

// Bad: Handle at controller level for business logic
@Controller()
export class CustomerController {
  async deleteCustomer(id: string) {
    try {
      return await this.service.deleteCustomer(id);
    } catch (error) {
      // Don't handle business logic errors here
    }
  }
}
```

### 4. Use Error Wrapping for External Services

```typescript
// Good: Wrap external service calls
async function callExternalAPI() {
  return RBACErrorUtils.wrapWithErrorHandling(
    async () => {
      return await externalService.call();
    },
    'ExternalService',
    'callAPI'
  );
}
```

### 5. Sanitize Sensitive Information

```typescript
// Good: The system automatically sanitizes sensitive fields
const exception = new RBACSystemException(
  RBACErrorCode.INTERNAL_SERVER_ERROR,
  {
    password: 'secret123', // Will be redacted
    normalField: 'value',  // Will be preserved
  }
);
```

## Migration Guide

### From Generic Exceptions

```typescript
// Before
throw new BadRequestException('Invalid entity type');
throw new ForbiddenException('Permission denied');
throw new UnauthorizedException('Authentication required');

// After
RBACErrorUtils.throwInvalidEntityType(entityType, availableEntities);
RBACErrorUtils.throwPermissionDenied(entityType, action, userId, tenantId);
RBACErrorUtils.throwAuthenticationRequired('Tenant context required');
```

### From Custom Error Classes

```typescript
// Before
class CustomPermissionError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// After
import { RBACAuthorizationException, RBACErrorCode } from './errors';

const exception = new RBACAuthorizationException(
  RBACErrorCode.PERMISSION_DENIED,
  { /* context */ }
);
```

## Troubleshooting

### Common Issues

1. **Missing Error Context**: Always provide relevant context for better debugging
2. **Generic Error Messages**: Use specific error codes instead of generic messages
3. **Sensitive Information Leakage**: The system automatically sanitizes, but be aware of custom context
4. **Missing Correlation IDs**: Ensure correlation IDs are passed through service calls

### Debug Mode

Enable debug mode in development:

```typescript
const errorHandler = new RBACErrorHandlerService({
  includeStackTrace: true,
  includeRequestDetails: true,
  useSimplifiedResponses: false,
});
```

This will include stack traces and request details in error responses for easier debugging.

## Contributing

When adding new error types:

1. Add the error code to `RBACErrorCode` enum
2. Add error messages to `ERROR_MESSAGES` object
3. Create factory functions if needed
4. Add utility methods to `RBACErrorUtils`
5. Write comprehensive tests
6. Update this documentation

## Requirements Validation

This error handling system satisfies the following RBAC requirements:

- **Requirement 7.1**: Descriptive error messages for authorization failures ✅
- **Requirement 7.3**: Different error responses for authentication vs authorization failures ✅
- **Requirement 7.4**: Graceful handling of edge cases like deleted roles or entities ✅

The system provides comprehensive error handling with clear, descriptive messages and proper error classification for all RBAC scenarios.