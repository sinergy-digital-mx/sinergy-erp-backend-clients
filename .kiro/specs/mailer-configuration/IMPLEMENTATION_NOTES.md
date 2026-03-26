# Mailer Configuration System - Implementation Notes

## Development Guidelines

### Code Organization

1. **Entities**: Define database models with TypeORM decorators
2. **DTOs**: Separate request/response DTOs for type safety
3. **Services**: Business logic with clear responsibilities
4. **Controllers**: HTTP endpoints with minimal logic
5. **Guards**: RBAC and authentication checks
6. **Pipes**: Input validation and transformation

### Naming Conventions

- **Tables**: `mailer_configurations`, `mailer_configuration_audits`, `mailer_configuration_health`
- **Entities**: `MailerConfiguration`, `MailerConfigurationAudit`, `MailerConfigurationHealth`
- **Services**: `MailerConfigurationService`, `MailerConfigurationTestService`
- **Controllers**: `MailerConfigurationController`, `MailerConfigurationTestController`
- **DTOs**: `CreateMailerConfigurationDto`, `UpdateMailerConfigurationDto`

## Encryption Implementation

### Key Management

```typescript
// Use environment variable or vault
const encryptionKey = process.env.MAILER_ENCRYPTION_KEY;
// Should be 32 bytes (256 bits) for AES-256
```

### Sensitive Fields by Vendor

| Vendor | Sensitive Fields |
|--------|------------------|
| Resend | `apiKey` |
| SendGrid | `apiKey` |
| AWS SES | `accessKeyId`, `secretAccessKey` |
| SMTP | `username`, `password` |

### Encryption Service Implementation

```typescript
// Encrypt before saving
const encrypted = await encryptionService.encrypt(sensitiveValue);

// Decrypt when retrieving
const decrypted = await encryptionService.decrypt(encryptedValue);

// Mask for display
const masked = encryptionService.mask(sensitiveValue); // ****value
```

## Validation Implementation

### Vendor-Specific Rules

```typescript
// Resend
- apiKey: required, min 20 chars
- publicKey: optional, starts with 'pk_'

// SendGrid
- apiKey: required, starts with 'SG.'
- senderEmail: optional, valid email format

// AWS SES
- accessKeyId: required, starts with 'AKIA'
- secretAccessKey: required, min 40 chars
- region: required, valid AWS region

// SMTP
- host: required, valid hostname
- port: required, 1-65535
- username: required, non-empty
- password: required, non-empty
- useTls: optional, boolean
```

## Tenant Isolation Implementation

### Query Pattern

```typescript
// Always include tenant_id in WHERE clause
const config = await repository.findOne({
  where: {
    id: configId,
    tenantId: tenantId, // CRITICAL: Always filter by tenant
  },
});
```

### Mutation Pattern

```typescript
// Verify ownership before mutation
const config = await repository.findOne({
  where: {
    id: configId,
    tenantId: tenantId,
  },
});

if (!config) {
  throw new ForbiddenException('Configuration not found or access denied');
}

// Proceed with mutation
```

## RBAC Integration

### Permission Mapping

```typescript
const permissions = {
  'mailer_configurations:Create': 'Create new configurations',
  'mailer_configurations:Read': 'View configurations',
  'mailer_configurations:Update': 'Modify configurations',
  'mailer_configurations:Delete': 'Remove configurations',
  'mailer_configurations:Test': 'Test configurations',
};
```

### Guard Implementation

```typescript
@UseGuards(JwtAuthGuard, RbacGuard)
@Post()
async create(
  @Body() dto: CreateMailerConfigurationDto,
  @CurrentUser() user: User,
) {
  // Guard verifies 'mailer_configurations:Create' permission
  // Proceed with creation
}
```

## Audit Trail Implementation

### Recording Changes

```typescript
// On create
await auditService.record({
  configurationId: config.id,
  tenantId: config.tenantId,
  action: 'CREATE',
  performedBy: userId,
  details: 'Configuration created',
});

// On update
await auditService.record({
  configurationId: config.id,
  tenantId: config.tenantId,
  action: 'UPDATE',
  changedFields: {
    name: { oldValue: oldConfig.name, newValue: newConfig.name },
    vendorConfig: { oldValue: '****', newValue: '****' },
  },
  performedBy: userId,
  details: 'Configuration updated',
});
```

## Health Monitoring Implementation

### Test Result Recording

```typescript
// After test
await healthService.recordTestResult(configId, {
  status: 'SUCCESS',
  timestamp: new Date(),
  error: null,
});

// Update consecutive failures
if (result.status === 'FAILURE') {
  await healthService.incrementFailures(configId);
} else {
  await healthService.resetFailures(configId);
}
```

### Usage Tracking

```typescript
// When configuration is used by email module
await healthService.recordUsage(configId);
```

## Error Handling

### Validation Errors

```typescript
throw new BadRequestException({
  message: 'Validation failed',
  errors: [
    {
      field: 'vendorConfig.apiKey',
      message: 'API key is required',
    },
  ],
});
```

### Authorization Errors

```typescript
throw new ForbiddenException({
  message: 'Insufficient permissions',
  requiredPermission: 'mailer_configurations:Create',
});
```

### Not Found Errors

```typescript
throw new NotFoundException({
  message: 'Mailer configuration not found',
});
```

## Testing Patterns

### Unit Test Template

```typescript
describe('MailerConfigurationService', () => {
  let service: MailerConfigurationService;
  let repository: Repository<MailerConfiguration>;

  beforeEach(async () => {
    // Setup
  });

  it('should create configuration with valid data', async () => {
    // Arrange
    const dto = { /* ... */ };
    
    // Act
    const result = await service.create(tenantId, dto, userId);
    
    // Assert
    expect(result.vendor).toBe(dto.vendor);
    expect(result.tenantId).toBe(tenantId);
  });
});
```

### Property Test Template

```typescript
import fc from 'fast-check';

describe('MailerConfiguration Properties', () => {
  it('Property 1: Vendor Type Persistence', () => {
    fc.assert(
      fc.property(
        fc.record({
          vendor: fc.constantFrom('resend', 'sendgrid', 'aws_ses', 'smtp'),
          name: fc.string({ minLength: 1 }),
        }),
        async (config) => {
          // Create configuration
          const created = await service.create(tenantId, config, userId);
          
          // Retrieve configuration
          const retrieved = await service.findById(tenantId, created.id);
          
          // Assert vendor type matches
          expect(retrieved.vendor).toBe(created.vendor);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Database Migration Example

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateMailerConfigurationTables1234567890000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create mailer_configurations table
    await queryRunner.createTable(
      new Table({
        name: 'mailer_configurations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'vendor',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'vendor_config',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_fallback',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_valid',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'deleted_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
        indices: [
          new TableIndex({
            columnNames: ['tenant_id', 'is_active'],
          }),
          new TableIndex({
            columnNames: ['tenant_id', 'is_fallback'],
          }),
          new TableIndex({
            columnNames: ['created_at'],
          }),
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('mailer_configurations');
  }
}
```

## Performance Considerations

### Indexing Strategy

1. **Primary Queries**: Index on `(tenant_id, is_active)` for active config retrieval
2. **Filtering**: Index on `(tenant_id, vendor)` for vendor filtering
3. **Audit**: Index on `(configuration_id, performed_at)` for audit queries
4. **Health**: Index on `(configuration_id)` for health lookups

### Query Optimization

```typescript
// Use select to limit columns
const config = await repository.find({
  where: { tenantId },
  select: ['id', 'name', 'vendor', 'isActive'],
});

// Use pagination for large result sets
const configs = await repository.find({
  where: { tenantId },
  skip: (page - 1) * limit,
  take: limit,
});
```

## Security Checklist

- [ ] Encryption key stored in secure vault
- [ ] All sensitive fields encrypted before storage
- [ ] Tenant ID verified on all queries
- [ ] RBAC guards on all endpoints
- [ ] Audit trail for all mutations
- [ ] Sensitive fields masked in logs
- [ ] SQL injection prevention (use parameterized queries)
- [ ] Rate limiting on test endpoint
- [ ] CORS properly configured
- [ ] HTTPS enforced in production

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Encryption key configured
- [ ] RBAC permissions created
- [ ] Audit logging enabled
- [ ] Monitoring and alerting configured
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team trained on system
- [ ] Rollback plan prepared
- [ ] Performance tested

