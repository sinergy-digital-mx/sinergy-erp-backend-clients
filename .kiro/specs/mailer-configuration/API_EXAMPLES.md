# Mailer Configuration System - API Examples

## Authentication

All requests require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Create Configuration

### Create Resend Configuration

```bash
POST /mailer-configurations
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Production Resend",
  "vendor": "resend",
  "vendorConfig": {
    "apiKey": "re_abc123def456",
    "publicKey": "pk_live_xyz789"
  }
}
```

**Response (201 Created)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenantId": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Production Resend",
  "vendor": "resend",
  "vendorConfig": {
    "apiKey": "****3def456",
    "publicKey": "pk_live_xyz789"
  },
  "isActive": false,
  "isFallback": false,
  "isValid": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "createdBy": "550e8400-e29b-41d4-a716-446655440002",
  "updatedAt": "2024-01-15T10:30:00Z",
  "updatedBy": "550e8400-e29b-41d4-a716-446655440002"
}
```

### Create SendGrid Configuration

```bash
POST /mailer-configurations
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "SendGrid Production",
  "vendor": "sendgrid",
  "vendorConfig": {
    "apiKey": "SG.abc123def456xyz789",
    "senderEmail": "noreply@example.com"
  }
}
```

### Create AWS SES Configuration

```bash
POST /mailer-configurations
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "AWS SES Production",
  "vendor": "aws_ses",
  "vendorConfig": {
    "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
    "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "region": "us-east-1"
  }
}
```

### Create SMTP Configuration

```bash
POST /mailer-configurations
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "SMTP Production",
  "vendor": "smtp",
  "vendorConfig": {
    "host": "smtp.gmail.com",
    "port": 587,
    "username": "your-email@gmail.com",
    "password": "your-app-password",
    "useTls": true
  }
}
```

## List Configurations

### List All Configurations

```bash
GET /mailer-configurations
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "tenantId": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Production Resend",
      "vendor": "resend",
      "isActive": true,
      "isFallback": false,
      "isValid": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "createdBy": "550e8400-e29b-41d4-a716-446655440002",
      "lastTestResult": "SUCCESS",
      "lastTestTimestamp": "2024-01-15T11:00:00Z",
      "lastUsedTimestamp": "2024-01-15T11:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

### Filter by Vendor

```bash
GET /mailer-configurations?vendor=resend
Authorization: Bearer <token>
```

### Filter by Date Range

```bash
GET /mailer-configurations?createdAfter=2024-01-01&createdBefore=2024-01-31
Authorization: Bearer <token>
```

### Filter by Status

```bash
GET /mailer-configurations?isActive=true
Authorization: Bearer <token>
```

## Get Configuration

### Get Specific Configuration

```bash
GET /mailer-configurations/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenantId": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Production Resend",
  "vendor": "resend",
  "vendorConfig": {
    "apiKey": "****3def456",
    "publicKey": "pk_live_xyz789"
  },
  "isActive": true,
  "isFallback": false,
  "isValid": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "createdBy": "550e8400-e29b-41d4-a716-446655440002",
  "updatedAt": "2024-01-15T10:30:00Z",
  "updatedBy": "550e8400-e29b-41d4-a716-446655440002",
  "lastTestResult": "SUCCESS",
  "lastTestTimestamp": "2024-01-15T11:00:00Z",
  "lastUsedTimestamp": "2024-01-15T11:15:00Z"
}
```

### Get Active Configuration

```bash
GET /mailer-configurations/active
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenantId": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Production Resend",
  "vendor": "resend",
  "vendorConfig": {
    "apiKey": "re_abc123def456",
    "publicKey": "pk_live_xyz789"
  },
  "isActive": true,
  "isFallback": false,
  "isValid": true
}
```

**Response (404 Not Found)** - When no active configuration:
```json
{
  "statusCode": 404,
  "message": "No active mailer configuration found for this tenant",
  "error": "Not Found"
}
```

## Update Configuration

```bash
PATCH /mailer-configurations/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Production Resend Updated",
  "vendorConfig": {
    "apiKey": "re_new_key_xyz789",
    "publicKey": "pk_live_new_key"
  }
}
```

**Response (200 OK)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenantId": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Production Resend Updated",
  "vendor": "resend",
  "vendorConfig": {
    "apiKey": "****y789",
    "publicKey": "pk_live_new_key"
  },
  "isActive": true,
  "isFallback": false,
  "isValid": true,
  "updatedAt": "2024-01-15T12:00:00Z",
  "updatedBy": "550e8400-e29b-41d4-a716-446655440002"
}
```

## Test Configuration

### Test Specific Configuration

```bash
POST /mailer-configurations/550e8400-e29b-41d4-a716-446655440000/test
Authorization: Bearer <token>
```

**Response (200 OK)** - Success:
```json
{
  "status": "SUCCESS",
  "message": "Connection test successful",
  "timestamp": "2024-01-15T12:30:00Z"
}
```

**Response (400 Bad Request)** - Failure:
```json
{
  "status": "FAILURE",
  "message": "Invalid API key",
  "details": "Authentication failed with Resend API",
  "timestamp": "2024-01-15T12:30:00Z"
}
```

### Test Vendor Connection (Without Saving)

```bash
POST /mailer-configurations/test-vendor
Content-Type: application/json
Authorization: Bearer <token>

{
  "vendor": "resend",
  "vendorConfig": {
    "apiKey": "re_test_key_123",
    "publicKey": "pk_live_test"
  }
}
```

## Activate Configuration

### Set as Active

```bash
POST /mailer-configurations/550e8400-e29b-41d4-a716-446655440000/activate
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenantId": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Production Resend",
  "vendor": "resend",
  "isActive": true,
  "isFallback": false,
  "isValid": true,
  "activatedAt": "2024-01-15T13:00:00Z"
}
```

**Response (400 Bad Request)** - Invalid configuration:
```json
{
  "statusCode": 400,
  "message": "Cannot activate invalid configuration. Please test the configuration first.",
  "error": "Bad Request"
}
```

## Fallback Configuration

### Set as Fallback

```bash
POST /mailer-configurations/550e8400-e29b-41d4-a716-446655440001/fallback
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "tenantId": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Fallback Resend",
  "vendor": "resend",
  "isActive": false,
  "isFallback": true,
  "isValid": true
}
```

### Clear Fallback

```bash
DELETE /mailer-configurations/550e8400-e29b-41d4-a716-446655440001/fallback
Authorization: Bearer <token>
```

**Response (204 No Content)**

## Delete Configuration

```bash
DELETE /mailer-configurations/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Response (204 No Content)**

**Response (400 Bad Request)** - Cannot delete active configuration:
```json
{
  "statusCode": 400,
  "message": "Cannot delete active configuration. Please deactivate it first.",
  "error": "Bad Request"
}
```

## Error Responses

### 400 Bad Request - Validation Error

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "vendorConfig.apiKey",
      "message": "API key is required for Resend vendor"
    },
    {
      "field": "vendorConfig.port",
      "message": "Port must be between 1 and 65535"
    }
  ]
}
```

### 403 Forbidden - Permission Denied

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "requiredPermission": "mailer_configurations:Create",
  "error": "Forbidden"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Mailer configuration not found",
  "error": "Not Found"
}
```

### 409 Conflict - Duplicate Name

```json
{
  "statusCode": 409,
  "message": "A configuration with this name already exists for your tenant",
  "error": "Conflict"
}
```

## Audit Trail

### View Audit History

```bash
GET /mailer-configurations/550e8400-e29b-41d4-a716-446655440000/audit
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "configurationId": "550e8400-e29b-41d4-a716-446655440000",
      "action": "CREATE",
      "performedBy": "550e8400-e29b-41d4-a716-446655440002",
      "performedAt": "2024-01-15T10:30:00Z",
      "details": "Configuration created"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "configurationId": "550e8400-e29b-41d4-a716-446655440000",
      "action": "TEST",
      "performedBy": "550e8400-e29b-41d4-a716-446655440002",
      "performedAt": "2024-01-15T11:00:00Z",
      "details": "Test successful"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440012",
      "configurationId": "550e8400-e29b-41d4-a716-446655440000",
      "action": "ACTIVATE",
      "performedBy": "550e8400-e29b-41d4-a716-446655440002",
      "performedAt": "2024-01-15T13:00:00Z",
      "details": "Configuration activated"
    }
  ]
}
```

