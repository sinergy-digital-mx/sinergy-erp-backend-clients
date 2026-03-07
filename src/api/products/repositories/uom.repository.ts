import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UoM } from '../../../entities/products/uom.entity';

@Injectable()
export class UoMRepository {
  constructor(
    @InjectRepository(UoM)
    private repo: Repository<UoM>,
  ) {}

  async create(uom: Partial<UoM>): Promise<UoM> {
    const newUoM = this.repo.create(uom);
    return this.repo.save(newUoM);
  }

  async findById(id: string): Promise<UoM | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['product'],
    });
  }

  async findByProduct(productId: string): Promise<UoM[]> {
    return this.repo.find({
      where: { product_id: productId },
      relations: ['product'],
    });
  }

  async update(id: string, updates: Partial<UoM>): Promise<UoM | null> {
    await this.repo.update(id, updates);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
