import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { TenantContextService } from './tenant-context.service';
import { ModuleService } from './module.service';

/**
 * Interface for menu item with permission check
 */
export interface MenuItemPermission {
  moduleCode: string;
  moduleName: string;
  hasViewPermission: boolean;
  permissions: string[];
}

/**
 * Service to handle menu visibility permissions
 * Provides methods to check View_Menu permissions for sidebar items
 */
@Injectable()
export class MenuPermissionService {
  private readonly logger = new Logger(MenuPermissionService.name);

  constructor(
    private permissionService: PermissionService,
    private tenantContextService: TenantContextService,
    private moduleService: ModuleService,
  ) {}

  /**
   * Check if user has Ver_Menu permission for a specific module
   * @param moduleCode - The module code (e.g., 'customers', 'leads')
   * @returns Promise<boolean> - True if user can view the menu item
   */
  async canViewMenu(moduleCode: string): Promise<boolean> {
    try {
      const tenantId = this.tenantContextService.getCurrentTenantId();
      const userId = this.tenantContextService.getCurrentUserId();

      if (!tenantId || !userId) {
        this.logger.warn('No tenant or user context available');
        return false;
      }

      return await this.permissionService.hasPermission(
        userId,
        tenantId,
        moduleCode,
        'Ver_Menu',
      );
    } catch (error) {
      this.logger.error(
        `Error checking Ver_Menu permission for module ${moduleCode}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Get all modules that the current user can view in the menu
   * @returns Promise with array of visible modules
   */
  async getVisibleModulesForCurrentUser(): Promise<MenuItemPermission[]> {
    try {
      const tenantId = this.tenantContextService.getCurrentTenantId();
      const userId = this.tenantContextService.getCurrentUserId();

      if (!tenantId || !userId) {
        this.logger.warn('No tenant or user context available');
        return [];
      }

      // Get all enabled modules for the tenant
      const { modules } = await this.moduleService.getEnabledModulesForCurrentTenant();

      // Check Ver_Menu permission for each module
      const visibleModules: MenuItemPermission[] = [];

      for (const module of modules) {
        const hasViewPermission = await this.permissionService.hasPermission(
          userId,
          tenantId,
          module.code,
          'Ver_Menu',
        );

        // Get all permissions user has for this module
        const userPermissions = await this.permissionService.getUserPermissions(
          userId,
          tenantId,
        );

        const modulePermissions = userPermissions
          .filter(p => p.entity_type?.toLowerCase() === module.code.toLowerCase())
          .map(p => p.action);

        visibleModules.push({
          moduleCode: module.code,
          moduleName: module.name,
          hasViewPermission,
          permissions: modulePermissions,
        });
      }

      return visibleModules;
    } catch (error) {
      this.logger.error('Error getting visible modules:', error);
      return [];
    }
  }

  /**
   * Get menu structure with permission checks
   * Returns only modules that user has Ver_Menu permission for
   * @returns Promise with filtered menu structure
   */
  async getAuthorizedMenuStructure(): Promise<{
    modules: Array<{
      code: string;
      name: string;
      description?: string;
      permissions: string[];
    }>;
  }> {
    try {
      const visibleModules = await this.getVisibleModulesForCurrentUser();

      // Filter only modules with Ver_Menu permission
      const authorizedModules = visibleModules
        .filter(m => m.hasViewPermission)
        .map(m => ({
          code: m.moduleCode,
          name: m.moduleName,
          permissions: m.permissions,
        }));

      this.logger.debug(
        `User has access to ${authorizedModules.length} menu items`,
      );

      return { modules: authorizedModules };
    } catch (error) {
      this.logger.error('Error getting authorized menu structure:', error);
      return { modules: [] };
    }
  }

  /**
   * Bulk check Ver_Menu permissions for multiple modules
   * @param moduleCodes - Array of module codes to check
   * @returns Promise with map of module code to permission status
   */
  async checkMultipleMenuPermissions(
    moduleCodes: string[],
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const moduleCode of moduleCodes) {
      const hasPermission = await this.canViewMenu(moduleCode);
      results.set(moduleCode, hasPermission);
    }

    return results;
  }

  /**
   * Check if user has Ver_Menu permission using current context
   * @param moduleCode - The module code
   * @returns Promise<boolean>
   */
  async canViewMenuInCurrentContext(moduleCode: string): Promise<boolean> {
    return this.canViewMenu(moduleCode);
  }
}
