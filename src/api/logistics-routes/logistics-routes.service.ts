import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { LogisticsRoute } from '../../entities/logistics/logistics-route.entity';
import { Module } from '../../entities/rbac/module.entity';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { UpsertLogisticsRouteDto } from './dto/logistics-route.dto';

const MODULE_CODE = 'logistics_routes';

@Injectable()
export class LogisticsRoutesService {
  constructor(
    @InjectRepository(LogisticsRoute)
    private readonly routes: Repository<LogisticsRoute>,
    @InjectRepository(Module)
    private readonly modules: Repository<Module>,
    @InjectRepository(TenantModule)
    private readonly tenantModules: Repository<TenantModule>,
  ) {}

  async isEnabled(tenantId: string): Promise<boolean> {
    try {
      const module = await this.modules.findOne({ where: { code: MODULE_CODE } });
      if (!module) return false;
      const row = await this.tenantModules.findOne({
        where: { tenant_id: tenantId, module_id: module.id, is_enabled: true },
      });
      return !!row;
    } catch (error) {
      if (this.isMissingTable(error)) return false;
      throw error;
    }
  }

  async setEnabled(tenantId: string, enabled: boolean): Promise<boolean> {
    const module = await this.modules.findOne({ where: { code: MODULE_CODE } });
    if (!module) {
      throw new BadRequestException('Falta aplicar la actualización de base de datos de rutas');
    }
    const existing = await this.tenantModules.findOne({
      where: { tenant_id: tenantId, module_id: module.id },
    });
    if (existing) {
      existing.is_enabled = enabled;
      await this.tenantModules.save(existing);
    } else {
      await this.tenantModules.save(
        this.tenantModules.create({
          tenant_id: tenantId,
          module_id: module.id,
          is_enabled: enabled,
        }),
      );
    }
    return enabled;
  }

  async list(tenantId: string, activeOnly = false): Promise<LogisticsRoute[]> {
    if (!(await this.isEnabled(tenantId))) return [];
    return this.routes.find({
      where: { tenant_id: tenantId, ...(activeOnly ? { is_active: true } : {}) },
      order: { name: 'ASC' },
    });
  }

  async create(tenantId: string, dto: UpsertLogisticsRouteDto): Promise<LogisticsRoute> {
    await this.assertEnabled(tenantId);
    try {
      return await this.routes.save(
        this.routes.create({
          tenant_id: tenantId,
          name: dto.name,
          code: dto.code,
          description: dto.description ?? null,
          is_active: dto.is_active !== false,
        }),
      );
    } catch (error) {
      if (this.isDuplicate(error)) {
        throw new BadRequestException('Ya existe una ruta con ese código');
      }
      throw error;
    }
  }

  async update(tenantId: string, id: string, dto: UpsertLogisticsRouteDto): Promise<LogisticsRoute> {
    await this.assertEnabled(tenantId);
    const row = await this.routes.findOne({ where: { id, tenant_id: tenantId } });
    if (!row) throw new NotFoundException('Ruta no encontrada');
    row.name = dto.name;
    row.code = dto.code;
    row.description = dto.description ?? null;
    if (dto.is_active != null) row.is_active = dto.is_active;
    try {
      return await this.routes.save(row);
    } catch (error) {
      if (this.isDuplicate(error)) {
        throw new BadRequestException('Ya existe una ruta con ese código');
      }
      throw error;
    }
  }

  async deactivate(tenantId: string, id: string): Promise<LogisticsRoute> {
    await this.assertEnabled(tenantId);
    const row = await this.routes.findOne({ where: { id, tenant_id: tenantId } });
    if (!row) throw new NotFoundException('Ruta no encontrada');
    row.is_active = false;
    return this.routes.save(row);
  }

  async assertActive(tenantId: string, routeId: string | null | undefined): Promise<void> {
    if (!routeId) return;
    if (!(await this.isEnabled(tenantId))) {
      throw new BadRequestException('Las rutas no están activas');
    }
    const row = await this.routes.findOne({
      where: { id: routeId, tenant_id: tenantId, is_active: true },
    });
    if (!row) throw new BadRequestException('La ruta no está activa');
  }

  private async assertEnabled(tenantId: string): Promise<void> {
    if (!(await this.isEnabled(tenantId))) {
      throw new BadRequestException('Las rutas no están activas');
    }
  }

  private isMissingTable(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;
    const driver = error.driverError as { code?: string; message?: string } | undefined;
    return driver?.code === 'ER_NO_SUCH_TABLE' || String(driver?.message || '').includes("doesn't exist");
  }

  private isDuplicate(error: unknown): boolean {
    const driver = (error as { driverError?: { code?: string } })?.driverError;
    return driver?.code === 'ER_DUP_ENTRY';
  }
}
