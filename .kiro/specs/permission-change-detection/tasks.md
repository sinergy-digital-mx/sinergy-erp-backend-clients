# Implementation Plan: Permission Change Detection

## Overview

Implement automatic detection of permission and role changes using a version-based approach. Each user has a `permissions_version` that increments when their permissions change. This version is embedded in JWT tokens and validated on each request.

## Tasks

- [x] 1. Add permissions_version to User entity and create version tracking service
  - Add `permissions_version` integer field to User entity (default: 1)
  - Create `PermissionVersionService` with methods to increment user version and increment versions for all users with a role
  - Update user creation to initialize permissions_version to 1
  - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [x] 2. Update role assignment logic to increment permissions_version
  - Modify `RoleService.assignRoleToUser()` to increment user's permissions_version
  - Modify `RoleService.removeRoleFromUser()` to increment user's permissions_version
  - Modify `RoleService.assignPermissionToRole()` to increment permissions_version for all users with that role
  - Modify `RoleService.removePermissionFromRole()` to increment permissions_version for all users with that role
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 3. Include permissions_version in JWT tokens
  - Update `AuthService.login()` to include permissions_version in JWT payload
  - Create `AuthService.refresh()` endpoint to generate new tokens with current permissions_version
  - Add POST /auth/refresh route to AuthController
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4. Create validation guard to detect stale permissions
  - Create `PermissionVersionGuard` that compares JWT version with database version
  - Return 401 with "PERMISSIONS_CHANGED" error when versions mismatch
  - Apply guard globally to all authenticated routes except /auth/refresh
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task builds on the previous one
- The version tracking ensures users always operate with current permissions
- The refresh endpoint allows seamless token updates without logout/login
