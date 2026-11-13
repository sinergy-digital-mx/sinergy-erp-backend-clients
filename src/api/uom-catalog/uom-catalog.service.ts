import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, QueryFailedError } from 'typeorm';
import { UoMCatalog } from '../../entities/uom-catalog/uom-catalog.entity';
import { CreateUoMCatalogDto } from './dto/create-uom-catalog.dto';
import { UpdateUoMCatalogDto } from './dto/update-uom-catalog.dto';
import { QueryUoMCatalogDto } from './dto/query-uom-catalog.dto';
import { PaginatedUoMCatalogDto } from './dto/paginated-uom-catalog.dto';

@Injectable()
export class UoMCatalogService {
  constructor(
    @InjectRepository(UoMCatalog)
    private readonly uomCatalogRepository: Repository<UoMCatalog>,
  ) {}

  async create(dto: CreateUoMCatalogDto, tenantId: string): Promise<UoMCatalog> {
    // Verificar que el nombre no exista para este tenant
    const existing = await this.uomCatalogRepository.findOne({
      where: { tenant_id: tenantId, name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Ya existe una unidad de medida con el nombre "${dto.name}"`);
    }

    const uom = this.uomCatalogRepository.create({
      ...dto,
      tenant_id: tenantId,
    });

    return await this.uomCatalogRepository.save(uom);
  }

  async findAll(query: QueryUoMCatalogDto, tenantId: string): Promise<PaginatedUoMCatalogDto> {
    const { page = 1, limit = 10, name } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: tenantId };

    if (name) {
      where.name = Like(`%${name}%`);
    }

    const [data, total] = await this.uomCatalogRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { name: 'ASC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, tenantId: string): Promise<UoMCatalog> {
    const uom = await this.uomCatalogRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!uom) {
      throw new NotFoundException(`UoM con ID ${id} no encontrada`);
    }

    return uom;
  }

  async update(id: string, dto: UpdateUoMCatalogDto, tenantId: string): Promise<UoMCatalog> {
    const uom = await this.findOne(id, tenantId);

    // Si se está actualizando el nombre, verificar que no exista
    if (dto.name && dto.name !== uom.name) {
      const existing = await this.uomCatalogRepository.findOne({
        where: { tenant_id: tenantId, name: dto.name },
      });

      if (existing) {
        throw new ConflictException(`Ya existe una unidad de medida con el nombre "${dto.name}"`);
      }
    }

    Object.assign(uom, dto);
    return await this.uomCatalogRepository.save(uom);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const uom = await this.findOne(id, tenantId);
    try {
      await this.uomCatalogRepository.remove(uom);
    } catch (error) {
      if (this.isInUseError(error)) {
        throw new ConflictException(
          'No se puede eliminar: la unidad está asignada a productos o movimientos',
        );
      }
      throw error;
    }
  }

  private isInUseError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;
    const driverError = error.driverError as { errno?: number; code?: string } | undefined;
    return driverError?.errno === 1451 || driverError?.code === 'ER_ROW_IS_REFERENCED_2';
  }
}
