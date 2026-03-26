# Resend Configuration System - Design Document

## Overview

The Resend Configuration System is a multi-tenant configuration management module that enables organizations to manage Resend email service provider credentials. The system provides secure credential storage and tenant-based isolation.

### Key Design Principles

- **Security First**: All sensitive credentials are encrypted at rest and masked in logs/exports
- **Tenant Isolation**: Complete data isolation between tenants with strict access control
- **Simplicity**: Single vendor (Resend) with minimal configuration

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Controllers)                   │
│  - ResendConfigurationController                             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Service Layer                              │
│  - ResendConfigurationService (CRUD, validation)             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Infrastructure Layer                            │
│  - EncryptionService (credential encryption/decryption)      │
│  - ResendConfigurationRepository (data access)               │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Data Layer (Database)                           │
│  - ResendConfiguration (main entity)                         │
└─────────────────────────────────────────────────────────────┘
```

### Module Structure

```
src/api/resend-configuration/
├── controllers/
│   └── resend-configuration.controller.ts
├── services/
│   └── resend-configuration.service.ts
├── dto/
│   ├── create-resend-configuration.dto.ts
│   ├── update-resend-configuration.dto.ts
│   ├── query-resend-configuration.dto.ts
│   └── resend-configuration.dto.ts
├── entities/
│   └── resend-configuration.entity.ts
├── repositories/
│   └── resend-configuration.repository.ts
└── resend-configuration.module.ts
```

---

## Components and Interfaces

### Core Entities

#### ResendConfiguration Entity

```typescript
interface ResendConfiguration {
  id: UUID;
  tenantId: UUID;
  name: string;
  apiKey: string; // Encrypted
  isActive: boolean;
  
  // Audit fields
  createdAt: DateTime;
  createdBy: UUID;
  updatedAt: DateTime;
  updatedBy: UUID;
}
```

### Service Interfaces

#### ResendConfigurationService

```typescript
interface IResendConfigurationService {
  // CRUD operations
  create(tenantId: UUID, dto: CreateResendConfigurationDto, userId: UUID): Promise<ResendConfiguration>;
  findById(tenantId: UUID, configId: UUID): Promise<ResendConfiguration>;
  findByTenant(tenantId: UUID, query: QueryResendConfigurationDto): Promise<PaginatedResult<ResendConfiguration>>;
  findActive(tenantId: UUID): Promise<ResendConfiguration>;
  update(tenantId: UUID, configId: UUID, dto: UpdateResendConfigurationDto, userId: UUID): Promise<ResendConfiguration>;
  delete(tenantId: UUID, configId: UUID, userId: UUID): Promise<void>;
  
  // Configuration management
  setActive(tenantId: UUID, configId: UUID, userId: UUID): Promise<ResendConfiguration>;
  
  // Retrieval for email module
  getActiveForModule(tenantId: UUID): Promise<ResendConfiguration>;
}
```

---

## Data Models

### Database Schema

#### resend_configurations table

```sql
CREATE TABLE resend_configurations (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  api_key TEXT NOT NULL, -- Encrypted
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL,
  created_by UUID NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  updated_by UUID NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, name),
  INDEX(tenant_id, is_active),
  INDEX(created_at)
);
```

### Enums

#### MailerVendor

```typescript
enum ResendVendor {
  RESEND = 'resend',
}
```

---

## Key Operation Flows

### Create Configuration Flow

```
1. User submits CreateResendConfigurationDto
2. RBAC Guard verifies 'resend_configurations:Create' permission
3. Validate tenant ownership
4. Validate api_key format
5. EncryptionService encrypts api_key
6. Store in database
7. Return configuration (with masked api_key)
```

### Set Active Configuration Flow

```
1. User submits configuration ID to activate
2. RBAC Guard verifies 'resend_configurations:Update' permission
3. Validate configuration exists and belongs to tenant
4. Deactivate current active configuration
5. Activate new configuration
6. Return updated configuration
```

### Retrieve Active Configuration for Email Module Flow

```
1. Email module requests active configuration for tenant
2. Query database for active configuration
3. Decrypt api_key
4. Return configuration with all necessary fields
```

### Update Configuration Flow

```
1. User submits UpdateResendConfigurationDto
2. RBAC Guard verifies 'resend_configurations:Update' permission
3. Validate configuration exists and belongs to tenant
4. Validate updated api_key format
5. Encrypt updated api_key
6. Update database record
7. Return updated configuration
```

---

## Security Considerations

### Credential Encryption

- **Algorithm**: AES-256-GCM for symmetric encryption
- **Key Management**: Use application-level encryption key stored in secure vault (AWS Secrets Manager, HashiCorp Vault)
- **Sensitive Fields**: api_key
- **Non-Sensitive Fields**: name, tenant_id, timestamps

### Tenant Isolation

- **Query Filtering**: All queries include `WHERE tenant_id = ?` clause
- **Access Control**: RBAC guards verify permissions before any operation
- **Cascade Delete**: Deleting tenant cascades to all configurations
- **Cross-Tenant Prevention**: Explicit validation on update/delete operations

### Audit Trail

- **Immutable Records**: Audit records are never updated, only inserted
- **User Attribution**: Every action records the performing user ID
- **Change Tracking**: Update operations record before/after values
- **Timestamp Precision**: Use UTC timestamps with millisecond precision

### Credential Masking

- **Display Format**: Show only last 4 characters (e.g., `****key123`)
- **Logs**: Automatically mask api_key in structured logs
- **Exports**: Exclude api_key from JSON exports
- **API Responses**: Return masked values in all API responses

---

## Correctness Properties

### Property 1: API Key Encryption

*For any* Resend configuration with an API key, the stored database representation should contain encrypted values, not plaintext.

### Property 2: API Key Decryption Round-Trip

*For any* Resend configuration with an API key, encrypting then decrypting should produce the original plaintext value.

### Property 3: API Key Masking

*For any* Resend configuration returned in API responses or logs, the API key should be masked showing only the last 4 characters.

### Property 4: Tenant Isolation on Creation

*For any* Resend configuration created by a user, the configuration should be associated with that user's tenant and not accessible to other tenants.

### Property 5: Tenant Isolation on Mutation

*For any* attempt to update or delete a Resend configuration from a different tenant, the operation should fail with a 403 Forbidden response.

### Property 6: Cascade Delete on Tenant Deletion

*For any* tenant with associated Resend configurations, deleting the tenant should cascade delete all its configurations.

### Property 7: Required Field Validation

*For any* Resend configuration creation attempt with missing api_key, the operation should fail with a validation error.

### Property 8: Active Configuration Designation

*For any* tenant with multiple Resend configurations, designating one as active should update its active status and record a timestamp.

### Property 9: Active Configuration Retrieval

*For any* tenant with an active Resend configuration, querying for the active configuration should return that configuration.

### Property 10: Active Configuration Replacement

*For any* tenant with an active configuration, setting a different configuration as active should deactivate the previous one.

### Property 11: RBAC Create Permission

*For any* user without 'resend_configurations:Create' permission, attempting to create a configuration should fail with 403 Forbidden.

### Property 12: RBAC Read Permission

*For any* user without 'resend_configurations:Read' permission, attempting to read configurations should fail with 403 Forbidden.

### Property 13: RBAC Update Permission

*For any* user without 'resend_configurations:Update' permission, attempting to update a configuration should fail with 403 Forbidden.

### Property 14: RBAC Delete Permission

*For any* user without 'resend_configurations:Delete' permission, attempting to delete a configuration should fail with 403 Forbidden.

### Property 15: Active Configuration Retrieval for Module

*For any* tenant with an active Resend configuration, the email module should be able to retrieve it with all necessary fields for Resend initialization.

### Property 26: Active Configuration Retrieval for Module

*For any* tenant with an active mailer configuration, the email module should be able to retrieve it with all necessary fields for vendor initialization.

**Validates: Requirements 9.1, 9.4**

### Property 27: Configuration Serialization Excludes Sensitive Fields

*For any* mailer configuration serialized to JSON, sensitive credentials should be excluded from the output.

**Validates: Requirements 10.1**

### Property 28: Configuration Deserialization Reconstruction

*For any* mailer configuration deserialized from JSON, all non-sensitive fields should be reconstructed correctly.

**Validates: Requirements 10.2**

### Property 29: Configuration Round-Trip Equivalence

*For any* mailer configuration, serializing to JSON and deserializing should produce an equivalent configuration (excluding sensitive fields).

**Validates: Requirements 10.3, 10.5**

### Property 30: Data Type Consistency in Serialization

*For any* mailer configuration serialized and deserialized, data types (strings, UUIDs, timestamps, enums) should be preserved.

**Validates: Requirements 10.4**

### Property 31: Fallback Configuration Designation

*For any* tenant with multiple configurations, designating one as fallback should update its fallback status.

**Validates: Requirements 11.3**

### Property 32: Test Result Recording

*For any* mailer configuration tested, the test result (success or failure) should be recorded in the health table.

**Validates: Requirements 12.1**

### Property 33: Last Used Timestamp Recording

*For any* mailer configuration used by the email module, the last_used_timestamp should be updated.

**Validates: Requirements 12.2**

### Property 34: Untested Configuration Status

*For any* newly created mailer configuration, the health status should indicate it has not been tested.

**Validates: Requirements 12.4**

### Property 35: Unused Configuration Status

*For any* newly created mailer configuration, the health status should indicate it has not been used.

**Validates: Requirements 12.5**

---

## Error Handling

### Validation Errors

- **Missing Required Fields**: Return 400 Bad Request with field names
- **Invalid Field Format**: Return 400 Bad Request with format specification
- **Invalid Vendor Type**: Return 400 Bad Request with supported vendors list
- **Duplicate Configuration Name**: Return 409 Conflict

### Authorization Errors

- **Missing Permission**: Return 403 Forbidden with required permission
- **Cross-Tenant Access**: Return 403 Forbidden
- **Invalid Tenant**: Return 403 Forbidden

### Not Found Errors

- **Configuration Not Found**: Return 404 Not Found
- **No Active Configuration**: Return 404 Not Found with descriptive message

### Test Connection Errors

- **Connection Failed**: Return 400 Bad Request with vendor-specific error details
- **Authentication Failed**: Return 400 Bad Request with "Invalid credentials"
- **Network Error**: Return 503 Service Unavailable

### State Errors

- **Cannot Activate Invalid Configuration**: Return 400 Bad Request
- **Cannot Delete Active Configuration**: Return 400 Bad Request (optional: allow with deactivation)
- **No Fallback Available**: Return 400 Bad Request when attempting fallback operations

---

## Testing Strategy

### Unit Testing Approach

Unit tests focus on specific examples, edge cases, and error conditions:

- **Validation Tests**: Test api_key format validation with valid and invalid inputs
- **Encryption Tests**: Test encryption/decryption round-trips with various api_keys
- **Masking Tests**: Test api_key masking in different output formats
- **RBAC Tests**: Test permission checks for each operation
- **Error Handling Tests**: Test error responses for various failure scenarios

### Property-Based Testing Approach

Property-based tests verify universal properties across all inputs using randomization:

- **Field Persistence**: Generate random configurations and verify all fields persist
- **Tenant Isolation**: Generate random tenants and verify complete isolation
- **Encryption Round-Trip**: Generate random api_keys and verify encryption/decryption
- **Active Configuration**: Generate random configuration sequences and verify active state management

### Test Coverage Goals

- **Unit Tests**: 85%+ code coverage
- **Integration Tests**: End-to-end flows for each operation type
- **Security Tests**: Encryption, masking, and isolation verification

