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
    return this.repo.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<UoMCatalog | null> {
    return this.repo.findOne({ where: { name } });
  }

  async findAll(): Promise<UoMCatalog[]> {
    return this.repo.find();
  }

  async create(name: string, description?: string): Promise<UoMCatalog> {
    const uom = this.repo.create({ name, description });
    return this.repo.save(uom);
  }
}
