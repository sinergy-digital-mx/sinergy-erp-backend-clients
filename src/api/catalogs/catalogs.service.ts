import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Catalog, CatalogType } from '../../entities/catalog.entity';

@Injectable()
export class CatalogsService {
  constructor(
    @InjectRepository(Catalog)
    private catalogRepo: Repository<Catalog>,
  ) {}

  async findByType(catalogType: CatalogType) {
    return this.catalogRepo.find({
      where: { catalog_type: catalogType, is_active: true },
      order: { sort_order: 'ASC', name: 'ASC' },
    });
  }

  async findByTypeAndCode(catalogType: CatalogType, code: string) {
    return this.catalogRepo.findOne({
      where: { catalog_type: catalogType, code, is_active: true },
    });
  }

  async search(catalogType: CatalogType, query: string) {
    return this.catalogRepo
      .createQueryBuilder('c')
      .where('c.catalog_type = :type', { type: catalogType })
      .andWhere('c.is_active = :active', { active: true })
      .andWhere(
        '(LOWER(c.name) LIKE LOWER(:query) OR c.code LIKE :query OR c.value LIKE :query)',
        { query: `%${query}%` }
      )
      .orderBy('c.sort_order', 'ASC')
      .addOrderBy('c.name', 'ASC')
      .getMany();
  }

  async findAll(catalogType?: CatalogType) {
    const query = this.catalogRepo
      .createQueryBuilder('c')
      .where('c.is_active = :active', { active: true });

    if (catalogType) {
      query.andWhere('c.catalog_type = :type', { type: catalogType });
    }

    return query
      .orderBy('c.catalog_type', 'ASC')
      .addOrderBy('c.sort_order', 'ASC')
      .addOrderBy('c.name', 'ASC')
      .getMany();
  }
}
