/**
 * RBAC Error Messages
 * 
 * Centralized repository of descriptive error messages for different types
 * of RBAC failures. Provides both technical and user-friendly messages.
 */

import { RBACErrorCode } from './rbac-error.types';

/**
 * Error message templates with placeholders for dynamic content
 */
export const ERROR_MESSAGES: Record<RBACErrorCode, {
  technical: string;
  userFriendly: string;
  suggestions: string[];
}> = {
  // Authentication Errors
  [RBACErrorCode.AUTH_TOKEN_MISSING]: {
    technical: 'Authentication token is missing from the request',
    userFriendly: 'You need to be logged in to access this resource',
    suggestions: [
      'Include a valid JWT token in the Authorization header',
      'Log in again to obtain a new authentication token',
    ],
  },
  
  [RBACErrorCode.AUTH_TOKEN_INVALID]: {
    technical: 'The provided authentication token is invalid or malformed',
    userFriendly: 'Your session is invalid. Please log in again',
    suggestions: [
      'Verify the token format and signature',
      'Log in again to obtain a new authentication token',
      'Check if the token has been tampered with',
    ],
  },
  
  [RBACErrorCode.AUTH_TOKEN_EXPIRED]: {
    technical: 'The authentication token has expired',
    userFriendly: 'Your session has expired. Please log in again',
    suggestions: [
      'Log in again to obtain a new authentication token',
      'Use token refresh if available',
    ],
  },
  
  [RBACErrorCode.AUTH_USER_NOT_FOUND]: {
    technical: 'The authenticated user was not found in the system',
    userFriendly: 'Your user account could not be found',
    suggestions: [
      'Contact your system administrator',
      'Verify your account status',
      'Log in again with correct credentials',
    ],
  },
  
  [RBACErrorCode.AUTH_CONTEXT_REQUIRED]: {
    technical: 'Tenant context is required but not provided',
    userFriendly: 'Organization context is required for this operation',
    suggestions: [
      'Include X-Tenant-ID header in your request',
      'Select an organization before performing this action',
      'Contact support if you don\'t have access to any organization',
    ],
  },

  // Authorization Errors
  [RBACErrorCode.PERMISSION_DENIED]: {
    technical: 'User lacks the required permission for this action',
    userFriendly: 'You don\'t have permission to perform this action',
    suggestions: [
      'Contact your administrator to request the necessary permissions',
      'Verify you\'re in the correct organization context',
      'Check if your role includes the required permissions',
    ],
  },
  
  [RBACErrorCode.CROSS_TENANT_ACCESS_DENIED]: {
    technical: 'Cross-tenant access attempt detected and blocked',
    userFriendly: 'You cannot access resources from a different organization',
    suggestions: [
      'Switch to the correct organization context',
      'Verify the X-Tenant-ID header matches your current organization',
      'Contact support if you need access to multiple organizations',
    ],
  },
  
  [RBACErrorCode.CROSS_USER_ACCESS_DENIED]: {
    technical: 'Cross-user access attempt detected and blocked',
    userFriendly: 'You cannot access another user\'s resources',
    suggestions: [
      'Ensure you\'re accessing your own resources',
      'Contact administrator for elevated permissions if needed',
    ],
  },
  
  [RBACErrorCode.INSUFFICIENT_PERMISSIONS]: {
    technical: 'User has some permissions but not sufficient for this operation',
    userFriendly: 'You have limited permissions for this resource',
    suggestions: [
      'Request additional permissions from your administrator',
      'Try a different action that you have permission for',
      'Contact support to understand your current permission level',
    ],
  },
  
  [RBACErrorCode.ROLE_ACCESS_DENIED]: {
    technical: 'User does not have access to the specified role',
    userFriendly: 'You don\'t have access to this role',
    suggestions: [
      'Contact administrator to be assigned the appropriate role',
      'Verify the role exists in your organization',
    ],
  },

  // Validation Errors
  [RBACErrorCode.INVALID_ENTITY_TYPE]: {
    technical: 'The specified entity type is not recognized by the system',
    userFriendly: 'The resource type is not valid',
    suggestions: [
      'Check the entity type against the available entities',
      'Verify spelling and capitalization',
      'Contact support for a list of valid entity types',
    ],
  },
  
  [RBACErrorCode.INVALID_ACTION_TYPE]: {
    technical: 'The specified action is not supported for this entity type',
    userFriendly: 'This action is not available for this resource type',
    suggestions: [
      'Use a supported action (Create, Read, Update, Delete, Export, etc.)',
      'Check the documentation for available actions',
      'Verify the action name spelling and capitalization',
    ],
  },
  
  [RBACErrorCode.INVALID_ROLE_DATA]: {
    technical: 'The role data provided is invalid or incomplete',
    userFriendly: 'The role information is not valid',
    suggestions: [
      'Ensure role name is provided and not empty',
      'Check that role name doesn\'t contain invalid characters',
      'Verify all required fields are included',
    ],
  },
  
  [RBACErrorCode.INVALID_PERMISSION_DATA]: {
    technical: 'The permission data provided is invalid or incomplete',
    userFriendly: 'The permission information is not valid',
    suggestions: [
      'Ensure both entity type and action are provided',
      'Verify entity type exists in the system',
      'Check that action is supported',
    ],
  },
  
  [RBACErrorCode.INVALID_TENANT_DATA]: {
    technical: 'The tenant data provided is invalid or incomplete',
    userFriendly: 'The organization information is not valid',
    suggestions: [
      'Ensure organization name is provided and unique',
      'Check that subdomain follows naming conventions',
      'Verify all required fields are included',
    ],
  },
  
  [RBACErrorCode.MALFORMED_REQUEST]: {
    technical: 'The request format is malformed or contains invalid data',
    userFriendly: 'The request format is incorrect',
    suggestions: [
      'Check the request format against the API documentation',
      'Ensure all required fields are included',
      'Verify JSON syntax if applicable',
    ],
  },

  // Conflict Errors
  [RBACErrorCode.ROLE_ALREADY_EXISTS]: {
    technical: 'A role with this name already exists in the tenant',
    userFriendly: 'A role with this name already exists',
    suggestions: [
      'Choose a different role name',
      'Update the existing role instead of creating a new one',
      'Check if you meant to assign the existing role',
    ],
  },
  
  [RBACErrorCode.PERMISSION_ALREADY_EXISTS]: {
    technical: 'A permission for this entity type and action already exists',
    userFriendly: 'This permission already exists',
    suggestions: [
      'Use the existing permission instead of creating a new one',
      'Check if you meant to assign the existing permission to a role',
    ],
  },
  
  [RBACErrorCode.USER_ROLE_ALREADY_EXISTS]: {
    technical: 'The user already has this role assigned in the tenant',
    userFriendly: 'This role is already assigned to the user',
    suggestions: [
      'The user already has the necessary permissions',
      'Check if you meant to assign a different role',
      'Remove the role first if you need to reassign it',
    ],
  },
  
  [RBACErrorCode.ROLE_PERMISSION_ALREADY_EXISTS]: {
    technical: 'The role already has this permission assigned',
    userFriendly: 'This permission is already assigned to the role',
    suggestions: [
      'The role already has the necessary permission',
      'Check if you meant to assign a different permission',
    ],
  },
  
  [RBACErrorCode.TENANT_ALREADY_EXISTS]: {
    technical: 'A tenant with this name or subdomain already exists',
    userFriendly: 'An organization with this name already exists',
    suggestions: [
      'Choose a different organization name or subdomain',
      'Check if you meant to access the existing organization',
    ],
  },

  // Not Found Errors
  [RBACErrorCode.ROLE_NOT_FOUND]: {
    technical: 'The specified role was not found in the tenant',
    userFriendly: 'The role could not be found',
    suggestions: [
      'Verify the role ID is correct',
      'Check if the role exists in your organization',
      'Contact administrator if the role should exist',
    ],
  },
  
  [RBACErrorCode.PERMISSION_NOT_FOUND]: {
    technical: 'The specified permission was not found in the system',
    userFriendly: 'The permission could not be found',
    suggestions: [
      'Verify the permission ID is correct',
      'Check if the permission exists for the entity type and action',
      'Create the permission if it doesn\'t exist',
    ],
  },
  
  [RBACErrorCode.USER_ROLE_NOT_FOUND]: {
    technical: 'The user role assignment was not found',
    userFriendly: 'The role assignment could not be found',
    suggestions: [
      'Verify the user has the role assigned',
      'Check if the role assignment exists in the correct organization',
    ],
  },
  
  [RBACErrorCode.TENANT_NOT_FOUND]: {
    technical: 'The specified tenant was not found in the system',
    userFriendly: 'The organization could not be found',
    suggestions: [
      'Verify the organization ID is correct',
      'Check if you have access to this organization',
      'Contact support if the organization should exist',
    ],
  },
  
  [RBACErrorCode.ENTITY_NOT_FOUND]: {
    technical: 'The specified entity was not found in the Entity Registry',
    userFriendly: 'The resource type is not available',
    suggestions: [
      'Check if the entity type is registered in the system',
      'Contact administrator to register the entity type',
      'Verify the entity name spelling',
    ],
  },

  // System Errors
  [RBACErrorCode.DATABASE_CONNECTION_FAILED]: {
    technical: 'Failed to connect to the database',
    userFriendly: 'A system error occurred. Please try again later',
    suggestions: [
      'Try the request again in a few moments',
      'Contact support if the problem persists',
    ],
  },
  
  [RBACErrorCode.CACHE_SERVICE_UNAVAILABLE]: {
    technical: 'The cache service is currently unavailable',
    userFriendly: 'The system is experiencing performance issues',
    suggestions: [
      'The request may take longer than usual',
      'Try again if the request fails',
      'Contact support if performance issues persist',
    ],
  },
  
  [RBACErrorCode.ENTITY_REGISTRY_UNAVAILABLE]: {
    technical: 'The Entity Registry service is currently unavailable',
    userFriendly: 'Some features may be temporarily unavailable',
    suggestions: [
      'Try the request again in a few moments',
      'Contact support if the problem persists',
    ],
  },
  
  [RBACErrorCode.INTERNAL_SERVER_ERROR]: {
    technical: 'An unexpected internal server error occurred',
    userFriendly: 'An unexpected error occurred. Please try again later',
    suggestions: [
      'Try the request again',
      'Contact support with the error details if the problem persists',
    ],
  },
  
  [RBACErrorCode.MIGRATION_FAILED]: {
    technical: 'Database migration or data migration failed',
    userFriendly: 'A system update failed. Please contact support',
    suggestions: [
      'Contact support immediately',
      'Do not attempt to retry the operation',
    ],
  },
};

/**
 * Get error message details for a specific error code
 */
export function getErrorMessage(code: RBACErrorCode) {
  return ERROR_MESSAGES[code] || {
    technical: 'Unknown error occurred',
    userFriendly: 'An unexpected error occurred',
    suggestions: ['Contact support for assistance'],
  };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(code: RBACErrorCode): string {
  return getErrorMessage(code).userFriendly;
}

/**
 * Get technical error message
 */
export function getTechnicalMessage(code: RBACErrorCode): string {
  return getErrorMessage(code).technical;
}

/**
 * Get error suggestions
 */
export function getErrorSuggestions(code: RBACErrorCode): string[] {
  return getErrorMessage(code).suggestions;
}