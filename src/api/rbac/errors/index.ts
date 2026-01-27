/**
 * RBAC Error Handling System
 * 
 * This module provides comprehensive error handling for the Role-Based Access Control system.
 * It includes standardized error types, response formats, and descriptive error messages
 * for different types of RBAC failures.
 * 
 * Requirements: 7.1, 7.3, 7.4
 */

export * from './rbac-error.types';
export * from './rbac-exceptions';
export * from './error-response.interface';
export * from './error-handler.service';
export * from './error-messages';