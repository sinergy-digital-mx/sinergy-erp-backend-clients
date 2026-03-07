import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UoMRelationship } from '../../../entities/products/uom-relationship.entity';

@Injectable()
export class UoMRelationshipRepository {
  constructor(
    @InjectRepository(UoMRelationship)
    private repo: Repository<UoMRelationship>,
  ) {}

  async create(relationship: Partial<UoMRelationship>): Promise<UoMRelationship> {
    const newRelationship = this.repo.create(relationship);
    return this.repo.save(newRelationship);
  }

  async findById(id: string): Promise<UoMRelationship | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['product', 'source_uom', 'target_uom'],
    });
  }

  async findByProduct(productId: string): Promise<UoMRelationship[]> {
    return this.repo.find({
      where: { product_id: productId },
      relations: ['product', 'source_uom', 'target_uom'],
    });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
