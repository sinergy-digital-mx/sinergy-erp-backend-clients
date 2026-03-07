import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UoMCatalog } from '../../entities/products/uom-catalog.entity';
import { CreateUoMCatalogDto } from './dto/create-uom-catalog.dto';
import { UpdateUoMCatalogDto } from './dto/update-uom-catalog.dto';

@Injectable()
export class UoMCatalogService {
  constructor(
    @InjectRepository(UoMCatalog)
    private repo: Repository<UoMCatalog>,
  ) {}

  async create(dto: CreateUoMCatalogDto): Promise<UoMCatalog> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new BadRequestException('Name cannot be empty');
    }

    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('UoM with this name already exists');
    }

    const uom = this.repo.create(dto);
    return this.repo.save(uom);
  }

  async findAll(): Promise<UoMCatalog[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<UoMCatalog> {
    const uom = await this.repo.findOne({ where: { id } });
    if (!uom) {
      throw new NotFoundException(`UoM with ID ${id} not found`);
    }
    return uom;
  }

  async update(id: string, dto: UpdateUoMCatalogDto): Promise<UoMCatalog> {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing && existing.id !== id) {
        throw new ConflictException('UoM with this name already exists');
      }
    }

    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
