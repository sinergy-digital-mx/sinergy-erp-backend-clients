# Requirements Document: Admin Cross-User Access Fix

## Introduction

This document specifies the requirements for fixing the admin user cross-user access issue in the RBAC system. Currently, admin users receive "Cross-user access denied: User context mismatch" errors when attempting to access other users' roles and permissions through API endpoints. The issue is that the `validateTenantContext()` method performs an unnecessary user ID match check that prevents any user from accessing another user's data, even when they have the appropriate permissions. The fix must remove this user ID match check and rely instead on permission-based access control, allowing any user with the appropriate permissions to access user configuration data.

## Glossary

- **Admin User**: A user with an admin role (where `is_admin = true` in the database)
- **Admin Role**: A role with the `is_admin` flag set to true
- **Tenant**: An isolated organizational context containing users, roles, and permissions
- **Cross-User Access**: Accessing data for a user other than the current authenticated user
- **Permission Service**: The service responsible for validating permissions and user context
- **Tenant Context**: The current tenant and user context extracted from JWT authentication
- **User Context Validation**: The process of verifying that the current user matches the requested user
- **Permission-Based Access Control**: Access control based on whether a user has specific permissions (e.g., User:Read) rather than user identity matching

## Requirements

### Requirement 1: Remove User ID Match Check from Tenant Context Validation

**User Story:** As a user with appropriate permissions, I want to access other users' roles and permissions for configuration purposes, so that I can manage user access without being blocked by user ID matching.

#### Acceptance Criteria

1. WHEN the validateTenantContext method is called with a userId parameter, THE PermissionService SHALL NOT throw an error based on user ID mismatch
2. WHEN a user requests GET /api/tenant/users/{userId}/roles where userId is their own, THE PermissionService SHALL allow access without requiring User:Read permission
3. WHEN a user with User:Read permission requests GET /api/tenant/users/{userId}/roles where userId is another user, THE PermissionService SHALL allow access
4. WHEN a user with User:Read permission requests GET /api/tenant/users/{userId}/permissions where userId is another user, THE PermissionService SHALL allow access
5. WHEN the validateTenantContext method is called, THE PermissionService SHALL still validate tenant context (tenant ID must match)
6. WHEN the validateTenantContext method is called without a userId parameter, THE PermissionService SHALL maintain current behavior for tenant-only validation

### Requirement 2: Permission-Based Access Control for User Data

**User Story:** As a system, I want to enforce access control based on permissions and user identity, so that users can access their own data and users with appropriate permissions can access other users' data.

#### Acceptance Criteria

1. WHEN a user requests their own data (userId matches current user), THE PermissionService SHALL allow access without requiring User:Read permission
2. WHEN a user requests another user's data and has User:Read permission, THE PermissionService SHALL allow access
3. WHEN a user requests another user's data and lacks User:Read permission, THE PermissionService SHALL deny access
4. WHEN a user requests their own data, THE PermissionService SHALL allow access even if they lack User:Read permission

### Requirement 3: Tenant Boundary Enforcement

**User Story:** As a system, I want to ensure that users cannot access data from other tenants, so that tenant isolation is maintained.

#### Acceptance Criteria

1. WHEN a user requests data for a user in a different tenant, THE PermissionService SHALL deny access regardless of permissions
2. WHEN validating tenant context, THE PermissionService SHALL check that the requested tenant matches the current tenant
3. WHEN tenant context validation fails, THE PermissionService SHALL throw UnauthorizedException with "Cross-tenant access denied" message

### Requirement 4: Consistent Application Across All Endpoints

**User Story:** As a developer, I want the user ID match check removal to be applied consistently across all user data endpoints, so that the system behavior is predictable.

#### Acceptance Criteria

1. WHEN the validateTenantContext method is called with a userId parameter, THE PermissionService SHALL not perform user ID matching
2. WHEN the getUserPermissions method is called for another user, THE PermissionService SHALL not throw cross-user access error
3. WHEN the checkBulkPermissions method is called for another user, THE PermissionService SHALL not throw cross-user access error
4. WHEN the checkPermissionForMultipleUsers method is called, THE PermissionService SHALL not throw cross-user access error

### Requirement 5: Backward Compatibility

**User Story:** As a system maintainer, I want the fix to maintain backward compatibility with existing code, so that no breaking changes are introduced.

#### Acceptance Criteria

1. WHEN existing code calls validateTenantContext without a userId parameter, THE PermissionService SHALL maintain current behavior
2. WHEN existing code calls getUserPermissions for the current user, THE PermissionService SHALL maintain current behavior
3. WHEN existing tests run, THE PermissionService SHALL pass all tests without modification
4. WHEN the PermissionGuard checks permissions, THE PermissionGuard SHALL continue to enforce permission-based access control

### Requirement 6: Security Audit Trail

**User Story:** As a security administrator, I want to track when users access other users' data, so that I can audit administrative actions.

#### Acceptance Criteria

1. WHEN a user accesses another user's data, THE PermissionService SHALL log the action with current user ID, target user ID, and action type
2. WHEN logging cross-user access, THE PermissionService SHALL include the tenant ID for audit trail purposes
3. WHEN a user without appropriate permissions attempts to access another user's data, THE PermissionService SHALL log the denied access attempt with user ID and target user ID
4. WHEN logging access decisions, THE PermissionService SHALL use appropriate log levels (debug for allowed, warn for denied)
