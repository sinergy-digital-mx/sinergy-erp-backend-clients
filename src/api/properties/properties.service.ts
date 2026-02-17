import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../../entities/properties/property.entity';
import { PropertyGroup } from '../../entities/properties/property-group.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private propertyRepo: Repository<Property>,
    @InjectRepository(PropertyGroup)
    private groupRepo: Repository<PropertyGroup>,
  ) {}

  async create(tenantId: string, dto: CreatePropertyDto): Promise<Property> {
    const property = this.propertyRepo.create({
      ...dto,
      tenant_id: tenantId,
    });

    const saved = await this.propertyRepo.save(property);

    // Update group stats
    await this.updateGroupStats(tenantId, dto.group_id);

    return saved;
  }

  async findAll(tenantId: string, groupId?: string): Promise<Property[]> {
    const query = this.propertyRepo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId });

    if (groupId) {
      query.andWhere('p.group_id = :groupId', { groupId });
    }

    return query.orderBy('p.code', 'ASC').getMany();
  }

  async findOne(tenantId: string, id: string): Promise<Property | null> {
    return this.propertyRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['group'],
    });
  }

  async findByCode(tenantId: string, code: string): Promise<Property | null> {
    return this.propertyRepo.findOne({
      where: { code, tenant_id: tenantId },
      relations: ['group'],
    });
  }

  async update(tenantId: string, id: string, dto: UpdatePropertyDto): Promise<Property> {
    const property = await this.findOne(tenantId, id);
    if (!property) {
      throw new Error('Property not found');
    }

    Object.assign(property, dto);
    const updated = await this.propertyRepo.save(property);

    // Update group stats
    await this.updateGroupStats(tenantId, property.group_id);

    return updated;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const property = await this.findOne(tenantId, id);
    if (!property) {
      throw new Error('Property not found');
    }

    await this.propertyRepo.remove(property);
    await this.updateGroupStats(tenantId, property.group_id);
  }

  async getPropertyStats(tenantId: string, groupId: string): Promise<any> {
    const stats = await this.propertyRepo
      .createQueryBuilder('p')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN p.status = 'disponible' THEN 1 ELSE 0 END)", 'available')
      .addSelect("SUM(CASE WHEN p.status = 'vendido' THEN 1 ELSE 0 END)", 'sold')
      .addSelect("SUM(CASE WHEN p.status = 'reservado' THEN 1 ELSE 0 END)", 'reserved')
      .addSelect('SUM(p.total_price)', 'total_value')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.group_id = :groupId', { groupId })
      .getRawOne();

    return {
      total: parseInt(stats.total) || 0,
      available: parseInt(stats.available) || 0,
      sold: parseInt(stats.sold) || 0,
      reserved: parseInt(stats.reserved) || 0,
      total_value: parseFloat(stats.total_value) || 0,
    };
  }

  private async updateGroupStats(tenantId: string, groupId: string): Promise<void> {
    const stats = await this.getPropertyStats(tenantId, groupId);

    await this.groupRepo.update(
      { id: groupId, tenant_id: tenantId },
      {
        total_properties: stats.total,
        available_properties: stats.available,
        sold_properties: stats.sold,
      },
    );
  }
}
