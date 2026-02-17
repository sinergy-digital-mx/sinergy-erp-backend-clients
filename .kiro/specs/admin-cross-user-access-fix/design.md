# Design Document: Admin Cross-User Access Fix

## Overview

The admin cross-user access fix addresses a security model issue in the RBAC system where the `validateTenantContext()` method performs an unnecessary user ID match check. This check prevents any user from accessing another user's roles and permissions, even when they have the appropriate permissions (e.g., User:Read).

The fix removes the user ID match check from `validateTenantContext()` and relies instead on permission-based access control enforced by the `PermissionGuard`. This allows users with appropriate permissions to access user configuration data while maintaining tenant isolation and security.

**Key Changes:**
- Remove user ID match validation from `validateTenantContext()`
- Maintain tenant boundary enforcement
- Rely on `PermissionGuard` for permission-based access control
- Add audit logging for cross-user access
- Ensure backward compatibility

## Architecture

### Current Flow (Problematic)
```
API Request → PermissionGuard (checks User:Read permission) → 
validateTenantContext() (throws error if userId doesn't match) → 
getUserPermissions() → Response
```

The issue: Even if the user has User:Read permission, `validateTenantContext()` blocks access.

### Fixed Flow
```
API Request → PermissionGuard (checks User:Read permission) → 
validateTenantContext() (only checks tenant match) → 
getUserPermissions() → Response
```

The fix: `validateTenantContext()` only validates tenant boundaries, not user identity.

## Components and Interfaces

### 1. PermissionService.validateTenantContext()

**Current Implementation:**
```typescript
private validateTenantContext(tenantId: string, userId?: string): void {
  const currentTenantId = this.tenantContextService.getCurrentTenantId();
  const currentUserId = this.tenantContextService.getCurrentUserId();

  if (currentTenantId && currentTenantId !== tenantId) {
    throw new UnauthorizedException(
      'Cross-tenant access denied: Tenant context mismatch',
    );
  }

  // THIS CHECK NEEDS TO BE REMOVED
  if (userId && currentUserId && currentUserId !== userId) {
    throw new UnauthorizedException(
      'Cross-user access denied: User context mismatch',
    );
  }
}
```

**Fixed Implementation:**
```typescript
private validateTenantContext(tenantId: string, userId?: string): void {
  const currentTenantId = this.tenantContextService.getCurrentTenantId();

  if (currentTenantId && currentTenantId !== tenantId) {
    throw new UnauthorizedException(
      'Cross-tenant access denied: Tenant context mismatch',
    );
  }

  // User ID match check removed - permission-based access control handles this
}
```

**Rationale:**
- The user ID match check is redundant because the `PermissionGuard` already enforces permission-based access control
- Removing this check allows users with appropriate permissions to access other users' data
- Tenant boundary enforcement is maintained
- The `userId` parameter is kept for backward compatibility but is no longer used for validation

### 2. PermissionService.getUserPermissions()

**Current Behavior:**
- Calls `validateTenantContext(tenantId, userId)` which throws if userId doesn't match
- This prevents accessing other users' permissions

**Fixed Behavior:**
- Calls `validateTenantContext(tenantId, userId)` which only validates tenant
- Returns permissions for the requested user
- Adds audit logging for cross-user access

**Implementation:**
```typescript
async getUserPermissions(
  userId: string,
  tenantId: string,
): Promise<Permission[]> {
  try {
    // Validate tenant context (userId parameter is kept for backward compatibility)
    this.validateTenantContext(tenantId, userId);

    // Log cross-user access if accessing another user's data
    const currentUserId = this.tenantContextService.getCurrentUserId();
    if (userId !== currentUserId) {
      this.logger.debug(
        `Cross-user access: User ${currentUserId} accessing permissions for user ${userId} in tenant ${tenantId}`,
      );
    }

    // Use cache-first approach with graceful degradation
    return await this.getUserPermissionsWithFallback(userId, tenantId);
  } catch (error) {
    this.logger.error(`Error getting permissions for user ${userId} in tenant ${tenantId}:`, error);
    
    if (this.isCriticalSystemError(error)) {
      this.logger.error(`Critical system error during permission retrieval - returning empty permissions`, {
        userId,
        tenantId,
        error: error.message,
      });
      return [];
    }
    
    throw error;
  }
}
```

### 3. PermissionGuard

**Current Behavior:**
- Checks if user has required permission (e.g., User:Read)
- Allows request if permission is granted

**Fixed Behavior:**
- No changes needed - already enforces permission-based access control
- Works correctly with the fixed `validateTenantContext()`

**How it works:**
```
1. User requests GET /api/tenant/users/{userId}/roles
2. PermissionGuard checks if user has User:Read permission
3. If yes, request proceeds to controller
4. Controller calls PermissionService.getUserRoles(userId, tenantId)
5. PermissionService validates tenant context (no user ID check)
6. PermissionService returns roles for the requested user
```

### 4. Audit Logging

**Cross-User Access Logging:**
- When a user accesses another user's data, log at DEBUG level
- Include: current user ID, target user ID, tenant ID, action type

**Denied Access Logging:**
- When access is denied (by PermissionGuard), log at WARN level
- Include: user ID, target user ID, tenant ID, reason

**Implementation:**
```typescript
// In getUserPermissions()
const currentUserId = this.tenantContextService.getCurrentUserId();
if (userId !== currentUserId) {
  this.logger.debug(
    `Cross-user access: User ${currentUserId} accessing permissions for user ${userId} in tenant ${tenantId}`,
  );
}

// In PermissionGuard (existing code)
if (!hasPermission) {
  this.logger.warn(
    `Access denied: User ${userId} lacks ${action} permission for ${entityType}`,
  );
}
```

## Data Models

No changes to data models. The fix only affects the validation logic in `PermissionService`.

**Existing Models Used:**
- `Permission`: Represents a permission (entity_type + action)
- `UserRole`: Links users to roles in a tenant
- `RolePermission`: Links roles to permissions
- `Role`: Represents a role with `is_admin` flag

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Tenant Boundary Enforcement
*For any* user and any two different tenants, when a user from tenant A attempts to access data from tenant B, the system SHALL deny access with a "Cross-tenant access denied" error.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 2: User ID Match Check Removal
*For any* user and any other user in the same tenant, when `validateTenantContext()` is called with different user IDs, the system SHALL NOT throw a "Cross-user access denied" error.
**Validates: Requirements 1.1, 4.1**

### Property 3: Permission-Based Access Control
*For any* user with User:Read permission and any other user in the same tenant, when the user requests another user's roles or permissions, the system SHALL return the requested data without throwing an error.
**Validates: Requirements 1.2, 1.3, 2.1, 2.4**

### Property 4: Permission Denial
*For any* user without User:Read permission and any other user in the same tenant, when the user requests another user's roles or permissions, the system SHALL deny access through the PermissionGuard.
**Validates: Requirements 2.2**

### Property 5: Backward Compatibility - Tenant-Only Validation
*For any* call to `validateTenantContext()` without a userId parameter, the system SHALL validate only the tenant context and maintain current behavior.
**Validates: Requirements 1.5, 5.1**

### Property 6: Backward Compatibility - Current User Access
*For any* user accessing their own data, the system SHALL allow access if they have the appropriate permission, maintaining current behavior.
**Validates: Requirements 2.3, 5.2**

### Property 7: Cross-User Access Logging
*For any* user accessing another user's data, the system SHALL log the action with the current user ID, target user ID, and tenant ID at DEBUG level.
**Validates: Requirements 6.1, 6.2**

### Property 8: Denied Access Logging
*For any* user without appropriate permissions attempting to access another user's data, the system SHALL log the denied access attempt at WARN level with user ID and target user ID.
**Validates: Requirements 6.3, 6.4**

### Property 9: No User ID Mismatch Errors in getUserPermissions
*For any* user and any other user in the same tenant, when `getUserPermissions()` is called for the other user, the system SHALL NOT throw a "Cross-user access denied" error.
**Validates: Requirements 4.2**

### Property 10: No User ID Mismatch Errors in checkBulkPermissions
*For any* user and any other user in the same tenant, when `checkBulkPermissions()` is called for the other user, the system SHALL NOT throw a "Cross-user access denied" error.
**Validates: Requirements 4.3**

### Property 11: No User ID Mismatch Errors in checkPermissionForMultipleUsers
*For any* call to `checkPermissionForMultipleUsers()` with multiple user IDs, the system SHALL NOT throw a "Cross-user access denied" error.
**Validates: Requirements 4.4**

### Property 12: Permission Guard Enforcement
*For any* user without User:Read permission, when the user attempts to access another user's roles or permissions through the API, the PermissionGuard SHALL deny the request.
**Validates: Requirements 5.4**

## Error Handling

### Tenant Context Mismatch
- **Error**: `UnauthorizedException` with message "Cross-tenant access denied: Tenant context mismatch"
- **When**: Tenant ID in request doesn't match current tenant context
- **Handling**: Deny access, log at WARN level

### Missing Tenant Context
- **Error**: `UnauthorizedException` with message "Tenant context is required"
- **When**: Tenant context is not available in request
- **Handling**: Deny access, log at ERROR level

### Permission Denied
- **Error**: Handled by `PermissionGuard`, returns 403 Forbidden
- **When**: User lacks required permission (e.g., User:Read)
- **Handling**: Deny access, log at WARN level

### Database Errors
- **Error**: Graceful degradation - return empty permissions
- **When**: Database query fails
- **Handling**: Log error, return empty array to prevent cascading failures

## Testing Strategy

### Unit Tests

**Test 1: validateTenantContext allows different user IDs**
- Setup: Create two users in the same tenant
- Action: Call validateTenantContext with different user IDs
- Assert: No error is thrown

**Test 2: validateTenantContext rejects different tenants**
- Setup: Create users in different tenants
- Action: Call validateTenantContext with different tenant IDs
- Assert: UnauthorizedException is thrown with "Cross-tenant access denied"

**Test 3: getUserPermissions returns data for other users**
- Setup: Create two users with User:Read permission in same tenant
- Action: User A calls getUserPermissions for User B
- Assert: User B's permissions are returned

**Test 4: getUserPermissions logs cross-user access**
- Setup: Create two users in same tenant
- Action: User A calls getUserPermissions for User B
- Assert: Debug log contains "Cross-user access" with both user IDs

**Test 5: PermissionGuard denies access without permission**
- Setup: Create user without User:Read permission
- Action: User attempts to access another user's roles
- Assert: PermissionGuard denies access with 403 Forbidden

**Test 6: Backward compatibility - current user access**
- Setup: Create user accessing their own data
- Action: User calls getUserPermissions for themselves
- Assert: Their permissions are returned

### Property-Based Tests

**Property Test 1: Tenant Boundary Enforcement**
- Generator: Random users from different tenants
- Property: For any user from tenant A accessing tenant B, access is denied
- Iterations: 100+

**Property Test 2: User ID Match Check Removal**
- Generator: Random pairs of users in same tenant
- Property: For any two users, validateTenantContext doesn't throw user ID mismatch error
- Iterations: 100+

**Property Test 3: Permission-Based Access Control**
- Generator: Random users with/without User:Read permission
- Property: Users with permission can access other users' data; users without permission cannot
- Iterations: 100+

**Property Test 4: Cross-User Access Logging**
- Generator: Random users accessing other users' data
- Property: For any cross-user access, logs contain current user ID, target user ID, and tenant ID
- Iterations: 100+

**Property Test 5: Backward Compatibility**
- Generator: Random users accessing their own data
- Property: For any user accessing their own data, behavior is unchanged
- Iterations: 100+

### Integration Tests

**Test 1: End-to-end GET /api/tenant/users/{userId}/roles**
- Setup: Create admin user with User:Read permission
- Action: Admin calls endpoint for another user
- Assert: Roles are returned successfully

**Test 2: End-to-end GET /api/tenant/users/{userId}/permissions**
- Setup: Create admin user with User:Read permission
- Action: Admin calls endpoint for another user
- Assert: Permissions are returned successfully

**Test 3: End-to-end access denied for non-admin**
- Setup: Create non-admin user without User:Read permission
- Action: Non-admin calls endpoint for another user
- Assert: 403 Forbidden is returned

## Implementation Notes

1. **Backward Compatibility**: The `userId` parameter in `validateTenantContext()` is kept but no longer used for validation. This maintains the method signature for existing code.

2. **Audit Logging**: Cross-user access is logged at DEBUG level to track administrative actions without creating excessive log volume.

3. **Permission Guard**: The existing `PermissionGuard` already enforces permission-based access control, so no changes are needed there.

4. **Graceful Degradation**: The existing error handling and graceful degradation mechanisms are maintained.

5. **Testing**: Both unit tests and property-based tests are needed to ensure the fix works correctly and maintains backward compatibility.

## Migration Path

1. Deploy the updated `PermissionService` with the fixed `validateTenantContext()` method
2. Existing code continues to work because the method signature is unchanged
3. Users with User:Read permission can now access other users' data
4. Monitor logs for cross-user access patterns
5. No database migrations needed
