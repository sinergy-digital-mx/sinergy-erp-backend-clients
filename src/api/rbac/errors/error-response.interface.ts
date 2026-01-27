/**
 * Standardized Error Response Interface
 * 
 * Defines the consistent format for all RBAC error responses
 * to ensure uniform client consumption and debugging experience.
 */

import { RBACErrorCode, RBACErrorCategory, RBACErrorSeverity } from './rbac-error.types';

/**
 * Standard RBAC error response format
 * This interface ensures all RBAC errors follow a consistent structure
 */
export interface RBACErrorResponse {
  /** HTTP status code */
  statusCode: number;
  
  /** Error type/name for programmatic handling */
  error: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Specific RBAC error code for detailed identification */
  code: RBACErrorCode;
  
  /** Error category for classification */
  category: RBACErrorCategory;
  
  /** Error severity level */
  severity: RBACErrorSeverity;
  
  /** Additional error details specific to the error type */
  details?: {
    /** Required permission information for authorization errors */
    requiredPermission?: {
      entityType: string;
      action: string;
    };
    
    /** User's current permissions for context */
    userPermissions?: string[];
    
    /** Tenant context information */
    tenantId?: string;
    
    /** User context information */
    userId?: string;
    
    /** Role information for role-related errors */
    roleInfo?: {
      roleId?: string;
      roleName?: string;
      conflictingRoles?: string[];
    };
    
    /** Validation error details */
    validationErrors?: Array<{
      field: string;
      message: string;
      value?: any;
    }>;
    
    /** System error context */
    systemContext?: {
      service?: string;
      operation?: string;
      correlationId?: string;
    };
  };
  
  /** Helpful suggestions for resolving the error */
  suggestions?: string[];
  
  /** Timestamp when the error occurred */
  timestamp: string;
  
  /** Request path where the error occurred */
  path: string;
  
  /** Correlation ID for tracking across services */
  correlationId?: string;
}

/**
 * Simplified error response for less sensitive contexts
 */
export interface RBACSimpleErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
}

/**
 * Error response for development/debugging environments
 * Includes additional debugging information
 */
export interface RBACDebugErrorResponse extends RBACErrorResponse {
  /** Stack trace for debugging (only in development) */
  stackTrace?: string;
  
  /** Request details for debugging */
  requestDetails?: {
    method: string;
    headers: Record<string, string>;
    query: Record<string, any>;
    body?: any;
  };
  
  /** Internal error details */
  internalError?: {
    originalError?: string;
    service?: string;
    operation?: string;
  };
}