# Mailer Configuration System - Architecture Summary

## Quick Overview

The Mailer Configuration System is a multi-tenant email provider configuration management module that:

1. **Supports Multiple Vendors**: Resend, SendGrid, AWS SES, SMTP
2. **Encrypts Credentials**: All sensitive data encrypted at rest using AES-256-GCM
3. **Isolates by Tenant**: Complete data separation between organizations
4. **Validates Configurations**: Vendor-specific field validation before storage
5. **Tracks Changes**: Complete audit trail with user attribution
6. **Manages Active Config**: One active configuration per tenant with fallback support
7. **Monitors Health**: Test results and usage tracking for proactive monitoring
8. **Enforces RBAC**: Permission-based access control for all operations

## Core Concepts

### Vendor Types

Each vendor has specific required and optional fields:

| Vendor | Required Fields | Optional Fields |
|--------|-----------------|-----------------|
| Resend | `apiKey` | `publicKey` |
| SendGrid | `apiKey` | `senderEmail` |
| AWS SES | `accessKeyId`, `secretAccessKey`, `region` | - |
| SMTP | `host`, `port`, `username`, `password` | `useTls` |

### Configuration Lifecycle

```
Create → Validate → Test → Activate → Monitor → Update/Delete
```

1. **Create**: Store configuration with vendor-specific fields
2. **Validate**: Check required fields and formats
3. **Test**: Verify connection to vendor service
4. **Activate**: Set as active configuration for tenant
5. **Monitor**: Track health and usage
6. **Update/Delete**: Modify or remove configuration

### Security Model

- **Encryption**: Sensitive fields encrypted before database storage
- **Masking**: API responses show only last 4 characters of secrets
- **Isolation**: Queries filtered by tenant_id at all levels
- **Audit**: Every operation recorded with user and timestamp
- **RBAC**: Five permission types (Create, Read, Update, Delete, Test)

## Database Schema

### Three Main Tables

1. **mailer_configurations**: Main configuration data
   - Stores vendor type, encrypted credentials, active/fallback status
   - Indexed by tenant_id and active status for fast queries

2. **mailer_configuration_audits**: Immutable audit trail
   - Records all changes with user attribution
   - Tracks before/after values for updates
   - Indexed by configuration_id and timestamp

3. **mailer_configuration_health**: Health monitoring
   - Tracks test results and usage
   - Records consecutive failures
   - Indexed by configuration_id and health status

## Service Architecture

### Three Main Services

1. **MailerConfigurationService**
   - CRUD operations with tenant isolation
   - Active/fallback configuration management
   - Validation and encryption coordination

2. **MailerConfigurationTestService**
   - Vendor-specific connection testing
   - Error handling and descriptive messages
   - Health status updates

3. **MailerConfigurationHealthService**
   - Test result recording
   - Usage tracking
   - Health status calculation

### Supporting Services

1. **EncryptionService**
   - AES-256-GCM encryption/decryption
   - Sensitive field masking
   - Key management integration

2. **VendorValidationService**
   - Vendor-specific field validation
   - Format validation (port ranges, key lengths)
   - Required field checking

3. **AuditService**
   - Audit record creation
   - Change tracking
   - User attribution

## API Endpoints

### Configuration Management

```
POST   /mailer-configurations              Create configuration
GET    /mailer-configurations              List configurations (with filtering)
GET    /mailer-configurations/:id          Get specific configuration
PATCH  /mailer-configurations/:id          Update configuration
DELETE /mailer-configurations/:id          Delete configuration
```

### Active Configuration

```
GET    /mailer-configurations/active       Get active configuration
POST   /mailer-configurations/:id/activate Set as active
```

### Fallback Configuration

```
POST   /mailer-configurations/:id/fallback Set as fallback
DELETE /mailer-configurations/:id/fallback Clear fallback
```

### Testing

```
POST   /mailer-configurations/:id/test     Test configuration
POST   /mailer-configurations/test-vendor  Test vendor connection
```

## Key Design Decisions

### 1. Encryption at Rest

**Decision**: Encrypt sensitive fields before database storage

**Rationale**: 
- Protects credentials even if database is compromised
- Complies with security best practices
- Allows safe logging and exports

**Implementation**:
- AES-256-GCM symmetric encryption
- Application-level encryption (not database-level)
- Encryption key stored in secure vault

### 2. Tenant Isolation

**Decision**: Filter all queries by tenant_id

**Rationale**:
- Prevents cross-tenant data leakage
- Simplifies permission model
- Enables multi-tenant scaling

**Implementation**:
- Every query includes `WHERE tenant_id = ?`
- Explicit validation on mutations
- Cascade delete on tenant removal

### 3. Immutable Audit Trail

**Decision**: Never update audit records, only insert

**Rationale**:
- Prevents tampering with audit history
- Maintains complete change history
- Enables forensic analysis

**Implementation**:
- Separate audit table
- Insert-only operations
- Indexed for efficient queries

### 4. Vendor-Specific Configuration

**Decision**: Store vendor config as JSONB with type-specific validation

**Rationale**:
- Supports multiple vendors with different fields
- Allows extensibility for new vendors
- Maintains type safety through DTOs

**Implementation**:
- Separate interfaces for each vendor
- Validation service with vendor-specific rules
- Type-safe DTOs for API layer

### 5. Health Monitoring

**Decision**: Track test results and usage separately

**Rationale**:
- Enables proactive issue detection
- Supports fallback configuration logic
- Provides operational insights

**Implementation**:
- Separate health table
- Test result recording
- Usage timestamp tracking

## Testing Strategy

### Unit Tests (85%+ coverage)

- Validation rules for each vendor
- Encryption/decryption round-trips
- Tenant isolation enforcement
- RBAC permission checks
- Audit trail recording

### Property-Based Tests (35 properties)

- Vendor type persistence across operations
- Field storage and retrieval
- Encryption round-trip equivalence
- Tenant isolation properties
- Serialization round-trip equivalence
- Active configuration state management
- Audit trail completeness

### Integration Tests

- End-to-end create-validate-activate flows
- Cross-tenant isolation verification
- Permission-based access control
- Error handling scenarios
- Fallback configuration usage

## Deployment Considerations

### Database Migrations

1. Create three tables with proper indexes
2. Add foreign key constraints
3. Set up cascade delete rules
4. Create indexes for common queries

### Configuration Requirements

1. Encryption key in secure vault
2. RBAC permissions configured
3. Audit logging enabled
4. Tenant context injection

### Monitoring

1. Track configuration test failures
2. Monitor health status changes
3. Alert on consecutive failures
4. Log all RBAC denials

## Future Enhancements

1. **Configuration Templates**: Pre-configured templates for common vendors
2. **Bulk Operations**: Import/export multiple configurations
3. **Configuration Versioning**: Track configuration history
4. **Webhook Notifications**: Alert on configuration changes
5. **Rate Limiting**: Prevent test connection abuse
6. **Configuration Cloning**: Copy existing configurations
7. **Scheduled Health Checks**: Periodic configuration testing

