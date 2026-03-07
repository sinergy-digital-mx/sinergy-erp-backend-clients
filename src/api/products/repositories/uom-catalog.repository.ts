import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UoMCatalog } from '../../../entities/products/uom-catalog.entity';

@Injectable()
export class UoMCatalogRepository {
  constructor(
    @InjectRepository(UoMCatalog)
    private repo: Repository<UoMCatalog>,
  ) {}

  async findById(id: string): Promise<UoMCatalog | null> {
    return this.repo.findOne({
      where: { id },
    });
  }

  async findAll(): Promise<UoMCatalog[]> {
    return this.repo.find({
      order: { name: 'ASC' },
    });
  }

  async findByName(name: string): Promise<UoMCatalog | null> {
    return this.repo.findOne({
      where: { name },
    });
  }

  async create(data: Partial<UoMCatalog>): Promise<UoMCatalog> {
    const catalog = this.repo.create(data);
    return this.repo.save(catalog);
  }

  async update(id: string, data: Partial<UoMCatalog>): Promise<UoMCatalog | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
