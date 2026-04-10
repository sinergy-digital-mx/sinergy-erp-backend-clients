# Design Document: Permission Change Detection

## Overview

This feature implements automatic detection of permission and role changes for authenticated users. When an administrator modifies a user's roles or permissions, the system detects the change on the next API request and forces the user to refresh their authentication token, ensuring they immediately operate with updated permissions.

The solution uses a version-based approach: each user has a `permissions_version` integer that increments whenever their permissions change. This version is embedded in JWT tokens and validated on each request. When a mismatch is detected, the client receives a 401 error with code "PERMISSIONS_CHANGED" and must call the refresh endpoint to obtain a new token with current permissions.

## Architecture

### Components

1. **Database Schema Extension**: Add `permissions_version` field to the `users` table
2. **Version Tracking Service**: Increment version when roles/permissions change
3. **JWT Enhancement**: Include `permissions_version` in token payload
4. **Validation Middleware**: Compare JWT version with database version on each request
5. **Refresh Endpoint**: Generate new tokens with current permissions

### Data Flow

```
User Login → Load Permissions → Generate JWT (with version) → Client Stores Token
    ↓
Admin Changes Permissions → Increment permissions_version in DB
    ↓
User Makes Request → Middleware Checks Version → Mismatch Detected → Return 401
    ↓
Client Calls /auth/refresh → New JWT Generated (with new version) → Continue
```

## Components and Interfaces

### 1. Database Schema

**users table modification:**
```typescript
@Column({ type: 'integer', default: 1 })
permissions_version: number;
```

### 2. Version Tracking Service

**Location:** `src/api/rbac/services/permission-version.service.ts`

```typescript
class PermissionVersionService {
  // Increment version for a single user
  async incrementUserVersion(userId: string): Promise<void>
  
  // Increment version for all users with a specific role
  async incrementVersionForUsersWithRole(roleId: string, tenantId: string): Promise<void>
  
  // Get current version for a user
  async getUserVersion(userId: string): Promise<number>
}
```

### 3. JWT Payload Extension

**Current JWT payload:**
```typescript
{
  sub: string,
  email: string,
  tenant_id: string,
  roles: Role[],
  permissions: string[],
  iat: number
}
```

**Enhanced JWT payload:**
```typescript
{
  sub: string,
  email: string,
  tenant_id: string,
  roles: Role[],
  permissions: string[],
  permissions_version: number,  // NEW
  iat: number
}
```

### 4. Validation Middleware

**Location:** `src/api/auth/guards/permission-version.guard.ts`

```typescript
@Injectable()
class PermissionVersionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Extract JWT version
    // Query database version
    // Compare versions
    // Throw UnauthorizedException with code "PERMISSIONS_CHANGED" if mismatch
  }
}
```

### 5. Refresh Endpoint

**Route:** `POST /auth/refresh`

**Request:**
```typescript
{
  // Uses existing JWT from Authorization header
}
```

**Response:**
```typescript
{
  access_token: string,
  user: {
    id: string,
    email: string,
    tenant_id: string,
    roles: string[],
    permissions_flat: string[],
    permissions_version: number
  }
}
```

## Data Models

### User Entity Extension

```typescript
@Entity('users')
export class User {
  // ... existing fields ...
  
  @Column({ type: 'integer', default: 1 })
  permissions_version: number;
}
```

### JWT Payload Type

```typescript
interface JWTPayload {
  sub: string;
  email: string;
  tenant_id: string;
  status: string;
  roles: Array<{
    id: string;
    name: string;
    isSystemRole: boolean;
  }>;
  permissions: string[];
  permissions_version: number;
  hasAdminRole: boolean;
  permissionCount: number;
  iat: number;
}
```

## Error Handling

### Error Codes

1. **PERMISSIONS_CHANGED** (HTTP 401)
   - Thrown when JWT version < database version
   - Client should call `/auth/refresh` to get new token
   
2. **INVALID_TOKEN** (HTTP 401)
   - Thrown when JWT is invalid or expired
   - Client should redirect to login

### Error Response Format

```typescript
{
  statusCode: 401,
  message: "Your permissions have been updated. Please refresh your session.",
  error: "PERMISSIONS_CHANGED"
}
```

## Testing Strategy

This feature involves database state, JWT generation, and middleware validation. Testing will use a combination of unit tests for individual components and integration tests for the complete flow.

### Unit Tests

1. **PermissionVersionService**
   - Test incrementing single user version
   - Test incrementing versions for all users with a role
   - Test retrieving current version

2. **AuthService JWT generation**
   - Test that login includes permissions_version in JWT
   - Test that refresh includes current permissions_version in JWT

3. **PermissionVersionGuard**
   - Test allowing requests when versions match
   - Test rejecting requests when JWT version < DB version
   - Test skipping validation for refresh endpoint

### Integration Tests

1. **Complete permission change flow**
   - User logs in and receives token with version 1
   - Admin assigns new role to user (version increments to 2)
   - User makes request with old token (version 1)
   - System returns 401 with PERMISSIONS_CHANGED
   - User calls refresh endpoint
   - User receives new token with version 2
   - User makes request with new token (succeeds)

2. **Role permission modification flow**
   - Multiple users have the same role
   - Admin adds permission to the role
   - All users' versions increment
   - All users must refresh their tokens

### Edge Cases

1. User has no roles (version still increments when role assigned)
2. Concurrent role assignments (version increments correctly)
3. Refresh endpoint called with already-current token (returns same version)
4. Token refresh during active permission change (uses latest version)

