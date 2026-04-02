import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantModule, Module } from '../../entities/rbac';

@Injectable()
export class TenantModuleValidationGuard implements CanActivate {
  constructor(
    @InjectRepository(TenantModule)
    private readonly tenantModuleRepository: Repository<TenantModule>,
    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip validation if no user (will be caught by JwtAuthGuard)
    if (!user || !user.tenant_id) {
      return true;
    }

    // Get the module code from the route or metadata
    const moduleCode = this.getModuleCodeFromRoute(request.url);

    if (!moduleCode) {
      // If we can't determine the module, allow access (will be validated elsewhere)
      return true;
    }

    // Check if the module is enabled for this tenant
    const module = await this.moduleRepository.findOne({
      where: { code: moduleCode },
    });

    if (!module) {
      // Module doesn't exist
      throw new ForbiddenException('Module not found');
    }

    const tenantModule = await this.tenantModuleRepository.findOne({
      where: {
        tenant_id: user.tenant_id,
        module_id: module.id,
        is_enabled: true,
      },
    });

    if (!tenantModule) {
      throw new ForbiddenException(
        `Module "${moduleCode}" is not enabled for your tenant`,
      );
    }

    return true;
  }

  /**
   * Extract module code from the request URL
   * Examples:
   * /tenant/purchase-orders -> purchase_orders
   * /tenant/vendors -> vendor
   */
  private getModuleCodeFromRoute(url: string): string | null {
    const match = url.match(/\/tenant\/([a-z-]+)/);
    if (!match) {
      return null;
    }

    // Convert kebab-case to snake_case
    const moduleCode = match[1].replace(/-/g, '_');
    return moduleCode;
  }
}
