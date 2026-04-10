# Permission Version Guard

## Overview

The `PermissionVersionGuard` is a global guard that validates JWT permission versions against the database to detect stale permissions. When a user's permissions change (role assignment/removal, role permission changes), their `permissions_version` in the database is incremented. This guard compares the version in the JWT with the current database version.

## How It Works

1. **Version Tracking**: Each user has a `permissions_version` field that increments when their permissions change
2. **JWT Embedding**: The version is embedded in JWT tokens during login/refresh
3. **Validation**: On each authenticated request, the guard compares JWT version with database version
4. **Mismatch Handling**: If JWT version < database version, returns 401 with "PERMISSIONS_CHANGED" error
5. **Token Refresh**: Client calls `/auth/refresh` to get a new token with updated permissions

## Configuration

The guard is applied globally in `app.module.ts`:

```typescript
{
  provide: APP_GUARD,
  useClass: PermissionVersionGuard,
}
```

## Excluded Routes

The guard automatically skips validation for:
- `/auth/refresh` - To avoid infinite loops when refreshing tokens
- Requests without authentication (handled by JwtAuthGuard)
- JWTs without permissions_version (backward compatibility)

## Error Response

When permissions are stale, the guard returns:

```json
{
  "statusCode": 401,
  "message": "Your permissions have been updated. Please refresh your session.",
  "error": "PERMISSIONS_CHANGED"
}
```

## Client Handling

When receiving a `PERMISSIONS_CHANGED` error:

1. Call `POST /auth/refresh` with the current JWT
2. Receive new token with updated permissions_version
3. Store new token and retry the original request

## Testing

Unit tests are in `permission-version.guard.spec.ts` and cover:
- Allowing requests when versions match
- Rejecting requests when JWT version is stale
- Skipping validation for excluded routes
- Backward compatibility with old JWTs
