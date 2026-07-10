import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ModuleService } from '../services/module.service';
import { TenantService } from '../services/tenant.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RBACTenant } from '../../../entities/rbac/tenant.entity';
import { Module } from '../../../entities/rbac/module.entity';
import { TenantModule } from '../../../entities/rbac/tenant-module.entity';
import { Permission } from '../../../entities/rbac/permission.entity';
import { v4 as uuidv4 } from 'uuid';

/**
 * ADMIN ONLY - Temporary controller for managing tenant modules
 * This controller has NO authentication/authorization guards
 * Use only in local development
 * 
 * CORS is enabled to allow access from file:// protocol (HTML file)
 */
@Controller('admin/tenant-modules')
export class AdminTenantModulesController {
  constructor(
    private readonly moduleService: ModuleService,
    private readonly tenantService: TenantService,
    @InjectRepository(RBACTenant)
    private tenantRepository: Repository<RBACTenant>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    @InjectRepository(TenantModule)
    private tenantModuleRepository: Repository<TenantModule>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Get all tenants
   */
  @Get('tenants')
  async getAllTenants() {
    const tenants = await this.tenantRepository.find({
      order: { name: 'ASC' },
    });

    return {
      tenants: tenants.map(t => ({
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        isActive: t.is_active,
        createdAt: t.created_at,
      })),
    };
  }

  /**
   * Get all modules
   */
  @Get('modules')
  async getAllModules() {
    return await this.moduleService.getAllModules();
  }

  /**
   * Get modules for a specific tenant with their enabled status
   */
  @Get('tenants/:tenantId/modules')
  async getTenantModules(@Param('tenantId') tenantId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      return { error: 'Tenant not found' };
    }

    const allModules = await this.moduleRepository.find({
      order: { category: 'ASC', sort_order: 'ASC', name: 'ASC' },
    });

    const tenantModules = await this.tenantModuleRepository.find({
      where: { tenant_id: tenantId },
    });

    const tenantModuleMap = new Map(
      tenantModules.map(tm => [tm.module_id, tm.is_enabled]),
    );

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
      },
      modules: allModules.map(m => ({
        id: m.id,
        name: m.name,
        code: m.code,
        description: m.description,
        category: m.category,
        sort_order: m.sort_order,
        isEnabled: tenantModuleMap.get(m.id) || false,
      })),
    };
  }

  /**
   * Enable a module for a tenant
   */
  @Post('tenants/:tenantId/modules/:moduleId/enable')
  @HttpCode(HttpStatus.OK)
  async enableModule(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
  ) {
    try {
      await this.moduleService.enableModuleForTenant(tenantId, moduleId);
      return { message: 'Module enabled successfully' };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Disable a module for a tenant
   */
  @Post('tenants/:tenantId/modules/:moduleId/disable')
  @HttpCode(HttpStatus.OK)
  async disableModule(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
  ) {
    try {
      await this.moduleService.disableModuleForTenant(tenantId, moduleId);
      return { message: 'Module disabled successfully' };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Enable all modules for a tenant
   */
  @Post('tenants/:tenantId/modules/enable-all')
  @HttpCode(HttpStatus.OK)
  async enableAllModules(@Param('tenantId') tenantId: string) {
    try {
      const allModules = await this.moduleRepository.find();
      let enabledCount = 0;

      for (const module of allModules) {
        try {
          await this.moduleService.enableModuleForTenant(tenantId, module.id, {
            skipPermissionRefresh: true,
          });
          enabledCount++;
        } catch (error) {
          // Skip if already enabled
        }
      }

      if (enabledCount > 0) {
        await this.moduleService.refreshTenantUserPermissionVersions(tenantId);
      }

      return {
        message: `Enabled ${enabledCount} modules successfully`,
        total: allModules.length,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get all permissions (admin only)
   */
  @Get('permissions')
  async getAllPermissions() {
    const permissions = await this.permissionRepository.find({
      relations: ['module'],
      order: { entity_type: 'ASC', action: 'ASC' },
    });

    return {
      permissions: permissions.map(p => ({
        id: p.id,
        entityType: p.entity_type,
        action: p.action,
        description: p.description,
        moduleId: p.module_id,
        moduleName: p.module?.name,
        moduleCode: p.module?.code,
        isSystemPermission: p.is_system_permission,
      })),
    };
  }

  /**
   * Get permissions for a specific module
   */
  @Get('modules/:moduleId/permissions')
  async getModulePermissions(@Param('moduleId') moduleId: string) {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['permissions'],
    });

    if (!module) {
      return { error: 'Module not found' };
    }

    return {
      module: {
        id: module.id,
        name: module.name,
        code: module.code,
      },
      permissions: module.permissions.map(p => ({
        id: p.id,
        entityType: p.entity_type,
        action: p.action,
        description: p.description,
        isSystemPermission: p.is_system_permission,
      })),
    };
  }

  /**
   * Create a new permission for a module
   */
  @Post('modules/:moduleId/permissions')
  @HttpCode(HttpStatus.CREATED)
  async createPermission(
    @Param('moduleId') moduleId: string,
    @Body() body: { action: string; description?: string },
  ) {
    try {
      const module = await this.moduleRepository.findOne({
        where: { id: moduleId },
      });

      if (!module) {
        return { error: 'Module not found' };
      }

      // Check if permission already exists
      const existing = await this.permissionRepository.findOne({
        where: {
          module_id: moduleId,
          action: body.action,
        },
      });

      if (existing) {
        return { error: `Permission '${body.action}' already exists for this module` };
      }

      // Get entity registry for this module using the manager
      const entityRegistryRepo = this.permissionRepository.manager.getRepository('EntityRegistry');
      const entityRegistry = await entityRegistryRepo
        .createQueryBuilder('er')
        .where('er.code = :code', { code: module.code })
        .getOne();

      if (!entityRegistry) {
        return { 
          error: `Entity registry not found for module code: ${module.code}. Please create it first.`,
          hint: `Run: INSERT INTO entity_registry (code, name) VALUES ('${module.code}', '${module.name}');`
        };
      }

      // Usar query builder para insertar directamente
      const permissionId = uuidv4();
      
      await this.permissionRepository
        .createQueryBuilder()
        .insert()
        .into('rbac_permissions')
        .values({
          id: permissionId,
          module_id: moduleId,
          entity_registry_id: entityRegistry.id,
          action: body.action,
          description: body.description || `${body.action} permission for ${module.name}`,
          is_system_permission: false,
        })
        .execute();

      // Obtener el permiso creado
      const saved = await this.permissionRepository.findOne({
        where: { id: permissionId },
      });

      if (!saved) {
        return { error: 'Permission created but could not be retrieved' };
      }

      return {
        message: 'Permission created successfully',
        permission: {
          id: saved.id,
          entityType: module.code,
          action: saved.action,
          description: saved.description,
        },
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Update a permission
   */
  @Put('permissions/:permissionId')
  async updatePermission(
    @Param('permissionId') permissionId: string,
    @Body() body: { action?: string; description?: string },
  ) {
    try {
      const permission = await this.permissionRepository.findOne({
        where: { id: permissionId },
      });

      if (!permission) {
        return { error: 'Permission not found' };
      }

      // Construir el objeto de actualización solo con los campos que se enviaron
      const updateData: any = {};
      
      if (body.action !== undefined) {
        updateData.action = body.action;
      }
      
      if (body.description !== undefined) {
        updateData.description = body.description;
      }

      // Si no hay nada que actualizar, retornar
      if (Object.keys(updateData).length === 0) {
        return { error: 'No fields to update' };
      }

      // Usar query builder para actualizar solo los campos especificados
      await this.permissionRepository
        .createQueryBuilder()
        .update()
        .set(updateData)
        .where('id = :id', { id: permissionId })
        .execute();

      // Obtener el permiso actualizado
      const updated = await this.permissionRepository.findOne({
        where: { id: permissionId },
        relations: ['entity_registry', 'module'],
      });

      if (!updated) {
        return { error: 'Permission updated but could not be retrieved' };
      }

      return {
        message: 'Permission updated successfully',
        permission: {
          id: updated.id,
          entityType: updated.entity_registry?.code || updated.module?.code || '',
          action: updated.action,
          description: updated.description,
        },
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Delete a permission (including system permissions with warning)
   */
  @Delete('permissions/:permissionId')
  @HttpCode(HttpStatus.OK)
  async deletePermission(@Param('permissionId') permissionId: string) {
    try {
      const permission = await this.permissionRepository.findOne({
        where: { id: permissionId },
      });

      if (!permission) {
        return { error: 'Permission not found' };
      }

      // Permitir eliminar cualquier permiso, pero advertir si es del sistema
      await this.permissionRepository.remove(permission);

      const message = permission.is_system_permission
        ? 'System permission deleted (use with caution)'
        : 'Permission deleted successfully';

      return { message };
    } catch (error) {
      return { error: error.message };
    }
  }
}
