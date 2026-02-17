import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module } from '../../../entities/rbac/module.entity';
import { TenantModule } from '../../../entities/rbac/tenant-module.entity';
import { Permission } from '../../../entities/rbac/permission.entity';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class ModuleService {
  constructor(
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    @InjectRepository(TenantModule)
    private tenantModuleRepository: Repository<TenantModule>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private tenantContextService: TenantContextService,
  ) {}

  /**
   * Get all modules enabled for the current tenant
   * @returns Promise with modules and their permissions
   */
  async getEnabledModulesForCurrentTenant() {
    const tenantId = this.tenantContextService.getCurrentTenantId();

    const tenantModules = await this.tenantModuleRepository
      .createQueryBuilder('tm')
      .leftJoinAndSelect('tm.module', 'module')
      .leftJoinAndSelect('module.permissions', 'permissions')
      .where('tm.tenant_id = :tenantId', { tenantId })
      .andWhere('tm.is_enabled = :isEnabled', { isEnabled: true })
      .orderBy('module.name', 'ASC')
      .addOrderBy('permissions.action', 'ASC')
      .getMany();

    return {
      modules: tenantModules.map(tm => ({
        id: tm.module.id,
        name: tm.module.name,
        code: tm.module.code,
        description: tm.module.description,
        is_enabled: tm.is_enabled,
        permissions: tm.module.permissions.map(p => ({
          id: p.id,
          action: p.action,
          description: p.description,
        })),
      })),
    };
  }

  /**
   * Get all modules (admin only - for reference)
   */
  async getAllModules() {
    const modules = await this.moduleRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.permissions', 'permissions')
      .orderBy('m.name', 'ASC')
      .addOrderBy('permissions.action', 'ASC')
      .getMany();

    return {
      modules: modules.map(m => ({
        id: m.id,
        name: m.name,
        code: m.code,
        description: m.description,
        permissions: m.permissions.map(p => ({
          id: p.id,
          action: p.action,
          description: p.description,
        })),
      })),
    };
  }

  /**
   * Create a new module (admin only)
   */
  async createModule(data: {
    name: string;
    code: string;
    description?: string;
  }) {
    // Check if module with same code already exists
    const existingModule = await this.moduleRepository.findOne({
      where: { code: data.code },
    });

    if (existingModule) {
      throw new ConflictException(
        `Module with code '${data.code}' already exists`,
      );
    }

    const module = this.moduleRepository.create(data);
    return await this.moduleRepository.save(module);
  }

  /**
   * Create a permission for a module (admin only)
   */
  async createPermissionForModule(
    moduleId: string,
    data: {
      action: string;
      description?: string;
    },
  ) {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    // Check if permission already exists for this module and action
    const existingPermission = await this.permissionRepository.findOne({
      where: {
        module_id: moduleId,
        action: data.action,
      },
    });

    if (existingPermission) {
      throw new ConflictException(
        `Permission '${data.action}' already exists for module '${module.name}'`,
      );
    }

    const permission = this.permissionRepository.create({
      module_id: moduleId,
      entity_type: module.code,
      action: data.action,
      description: data.description,
      is_system_permission: true,
    });

    return await this.permissionRepository.save(permission);
  }

  /**
   * Enable a module for a tenant (admin only)
   */
  async enableModuleForTenant(tenantId: string, moduleId: string) {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    // Check if already enabled
    const existingTenantModule = await this.tenantModuleRepository.findOne({
      where: { tenant_id: tenantId, module_id: moduleId },
    });

    if (existingTenantModule) {
      if (existingTenantModule.is_enabled) {
        throw new ConflictException(
          `Module '${module.name}' is already enabled for this tenant`,
        );
      }
      // Re-enable if disabled
      existingTenantModule.is_enabled = true;
      return await this.tenantModuleRepository.save(existingTenantModule);
    }

    const tenantModule = this.tenantModuleRepository.create({
      tenant_id: tenantId,
      module_id: moduleId,
      is_enabled: true,
    });

    return await this.tenantModuleRepository.save(tenantModule);
  }

  /**
   * Disable a module for a tenant (admin only)
   */
  async disableModuleForTenant(tenantId: string, moduleId: string) {
    const tenantModule = await this.tenantModuleRepository.findOne({
      where: { tenant_id: tenantId, module_id: moduleId },
    });

    if (!tenantModule) {
      throw new NotFoundException(
        `Module is not assigned to this tenant`,
      );
    }

    tenantModule.is_enabled = false;
    return await this.tenantModuleRepository.save(tenantModule);
  }

  /**
   * Get module by code
   */
  async getModuleByCode(code: string) {
    const module = await this.moduleRepository.findOne({
      where: { code },
      relations: ['permissions'],
    });

    if (!module) {
      throw new NotFoundException(`Module with code '${code}' not found`);
    }

    return module;
  }
}
