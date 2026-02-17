# Implementation Plan: Admin Cross-User Access Fix

## Overview

This implementation plan breaks down the admin cross-user access fix into discrete coding tasks. The fix removes the user ID match check from the `validateTenantContext()` method in the PermissionService, allowing permission-based access control to handle cross-user access instead of blocking it at the validation layer.

The implementation follows a test-driven approach with property-based tests validating correctness properties and unit tests covering specific examples and edge cases.

## Tasks

- [x] 1. Update validateTenantContext() to remove user ID match check
  - Modify `src/api/rbac/services/permission.service.ts`
  - Remove the user ID comparison logic that throws "Cross-user access denied" error
  - Keep tenant ID validation intact
  - Keep the userId parameter for backward compatibility
  - _Requirements: 1.1, 1.4, 1.5, 4.1_

- [x]* 1.1 Write property test for tenant boundary enforcement
  - **Property 1: Tenant Boundary Enforcement**
  - **Validates: Requirements 3.1, 3.2, 3.3**
  - Create test that verifies users cannot access data from different tenants
  - Test with 100+ random tenant pairs
  - _Requirements: 3.1, 3.2, 3.3_

- [x]* 1.2 Write property test for user ID match check removal
  - **Property 2: User ID Match Check Removal**
  - **Validates: Requirements 1.1, 4.1**
  - Create test that verifies validateTenantContext doesn't throw user ID mismatch errors
  - Test with 100+ random user pairs in same tenant
  - _Requirements: 1.1, 4.1_

- [x] 2. Add audit logging for cross-user access
  - Modify `src/api/rbac/services/permission.service.ts` in getUserPermissions()
  - Add debug-level logging when a user accesses another user's data
  - Include current user ID, target user ID, and tenant ID in logs
  - _Requirements: 6.1, 6.2_

- [x]* 2.1 Write property test for cross-user access logging
  - **Property 7: Cross-User Access Logging**
  - **Validates: Requirements 6.1, 6.2**
  - Create test that verifies logs contain required information
  - Test with 100+ random cross-user access scenarios
  - _Requirements: 6.1, 6.2_

- [x]* 2.2 Write unit test for denied access logging
  - **Property 8: Denied Access Logging**
  - **Validates: Requirements 6.3, 6.4**
  - Create test that verifies denied access is logged at WARN level
  - Test with users lacking User:Read permission
  - _Requirements: 6.3, 6.4_

- [x] 3. Verify getUserPermissions() works with other users
  - Modify `src/api/rbac/services/permission.service.ts` if needed
  - Ensure getUserPermissions() no longer throws cross-user access errors
  - Test that it returns permissions for requested user
  - _Requirements: 4.2_

- [x]* 3.1 Write property test for getUserPermissions cross-user access
  - **Property 9: No User ID Mismatch Errors in getUserPermissions**
  - **Validates: Requirements 4.2**
  - Create test that verifies getUserPermissions doesn't throw errors for other users
  - Test with 100+ random user pairs
  - _Requirements: 4.2_

- [x] 4. Verify checkBulkPermissions() works with other users
  - Review `src/api/rbac/services/permission.service.ts` checkBulkPermissions()
  - Ensure it calls validateTenantContext correctly
  - Verify it doesn't throw cross-user access errors
  - _Requirements: 4.3_

- [x]* 4.1 Write property test for checkBulkPermissions cross-user access
  - **Property 10: No User ID Mismatch Errors in checkBulkPermissions**
  - **Validates: Requirements 4.3**
  - Create test that verifies checkBulkPermissions doesn't throw errors for other users
  - Test with 100+ random bulk permission checks
  - _Requirements: 4.3_

- [x] 5. Verify checkPermissionForMultipleUsers() works correctly
  - Review `src/api/rbac/services/permission.service.ts` checkPermissionForMultipleUsers()
  - Ensure it doesn't throw cross-user access errors
  - Verify it returns correct permission results for multiple users
  - _Requirements: 4.4_

- [x]* 5.1 Write property test for checkPermissionForMultipleUsers
  - **Property 11: No User ID Mismatch Errors in checkPermissionForMultipleUsers**
  - **Validates: Requirements 4.4**
  - Create test that verifies no errors are thrown for multiple users
  - Test with 100+ random multi-user permission checks
  - _Requirements: 4.4_

- [x] 6. Verify PermissionGuard still enforces permission-based access control
  - Review `src/api/rbac/guards/permission.guard.ts`
  - Ensure it still checks User:Read permission for user data endpoints
  - Verify it denies access for users without permission
  - _Requirements: 5.4_

- [x]* 6.1 Write property test for PermissionGuard enforcement
  - **Property 12: Permission Guard Enforcement**
  - **Validates: Requirements 5.4**
  - Create test that verifies PermissionGuard denies access without permission
  - Test with 100+ random users with/without User:Read permission
  - _Requirements: 5.4_

- [x] 7. Write unit tests for backward compatibility
  - Create test for validateTenantContext without userId parameter
  - Create test for getUserPermissions with current user
  - Create test for existing permission checks
  - _Requirements: 5.1, 5.2_

- [x]* 7.1 Write property test for backward compatibility
  - **Property 5: Backward Compatibility - Tenant-Only Validation**
  - **Validates: Requirements 1.5, 5.1**
  - Create test that verifies tenant-only validation works
  - Test with 100+ random tenant validation scenarios
  - _Requirements: 1.5, 5.1_

- [x]* 7.2 Write property test for current user access
  - **Property 6: Backward Compatibility - Current User Access**
  - **Validates: Requirements 2.3, 5.2**
  - Create test that verifies users can access their own data
  - Test with 100+ random current user access scenarios
  - _Requirements: 2.3, 5.2_

- [x] 8. Write unit tests for permission-based access control
  - Create test for user with User:Read permission accessing other user's data
  - Create test for user without User:Read permission being denied
  - Create test for cross-tenant access being denied
  - _Requirements: 2.1, 2.2, 3.1_

- [x]* 8.1 Write property test for permission-based access control
  - **Property 3: Permission-Based Access Control**
  - **Validates: Requirements 1.2, 1.3, 2.1, 2.4**
  - Create test that verifies users with permission can access other users' data
  - Test with 100+ random permission scenarios
  - _Requirements: 1.2, 1.3, 2.1, 2.4_

- [x]* 8.2 Write property test for permission denial
  - **Property 4: Permission Denial**
  - **Validates: Requirements 2.2**
  - Create test that verifies users without permission are denied access
  - Test with 100+ random denial scenarios
  - _Requirements: 2.2_

- [x] 9. Write integration tests for API endpoints
  - Create test for GET /api/tenant/users/{userId}/roles with admin user
  - Create test for GET /api/tenant/users/{userId}/permissions with admin user
  - Create test for access denied without User:Read permission
  - Create test for cross-tenant access denied
  - _Requirements: 1.2, 1.3, 2.2, 3.1_

- [x] 10. Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property-based tests with 100+ iterations each
  - Run all integration tests
  - Verify no regressions in existing tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Verify logging output
  - Run application with cross-user access scenarios
  - Verify debug logs contain cross-user access information
  - Verify warn logs contain denied access information
  - Verify logs include user IDs and tenant IDs
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 12. Final checkpoint - Ensure all tests pass and code is ready
  - Run full test suite one final time
  - Verify all property-based tests pass with 100+ iterations
  - Verify all unit tests pass
  - Verify all integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property-based tests validate universal correctness properties across many inputs
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end API behavior
- All tests should run with minimum 100 iterations for property-based tests
- Each property test should reference its design document property number
- Backward compatibility is critical - existing code must continue to work
- Audit logging is important for security and compliance
