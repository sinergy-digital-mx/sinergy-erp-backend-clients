import { Injectable, Scope } from '@nestjs/common';

/**
 * Service to manage current tenant context throughout the request lifecycle.
 * Uses REQUEST scope to ensure each request has its own tenant context.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private tenantId: string | null = null;
  private userId: string | null = null;

  /**
   * Set the current tenant context for this request
   */
  setTenantContext(tenantId: string, userId: string | null): void {
    this.tenantId = tenantId;
    this.userId = userId;
  }

  /**
   * Get the current tenant ID
   */
  getCurrentTenantId(): string | null {
    return this.tenantId;
  }

  /**
   * Get the current user ID
   */
  getCurrentUserId(): string | null {
    return this.userId;
  }

  /**
   * Check if tenant context is set
   */
  hasContext(): boolean {
    return this.tenantId !== null && this.userId !== null;
  }

  /**
   * Clear the current context (useful for testing)
   */
  clearContext(): void {
    this.tenantId = null;
    this.userId = null;
  }

  /**
   * Validate that the current context matches expected values
   */
  validateContext(expectedTenantId?: string, expectedUserId?: string): boolean {
    if (expectedTenantId && this.tenantId !== expectedTenantId) {
      return false;
    }
    if (expectedUserId && this.userId !== expectedUserId) {
      return false;
    }
    return this.hasContext();
  }
}