import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyGroup } from '../../entities/properties/property-group.entity';
import { Property } from '../../entities/properties/property.entity';
import { CreatePropertyGroupDto } from './dto/create-property-group.dto';
import { UpdatePropertyGroupDto } from './dto/update-property-group.dto';

@Injectable()
export class PropertyGroupsService {
  constructor(
    @InjectRepository(PropertyGroup)
    private groupRepo: Repository<PropertyGroup>,
    @InjectRepository(Property)
    private propertyRepo: Repository<Property>,
  ) {}

  async create(tenantId: string, dto: CreatePropertyGroupDto): Promise<PropertyGroup> {
    const group = this.groupRepo.create({
      ...dto,
      tenant_id: tenantId,
    });

    return await this.groupRepo.save(group);
  }

  async findAll(tenantId: string): Promise<PropertyGroup[]> {
    return await this.groupRepo.find({
      where: { tenant_id: tenantId },
      relations: ['properties'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<PropertyGroup | null> {
    return await this.groupRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['properties'],
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdatePropertyGroupDto,
  ): Promise<PropertyGroup> {
    const group = await this.findOne(tenantId, id);
    if (!group) {
      throw new NotFoundException(`Property group with ID ${id} not found`);
    }

    Object.assign(group, dto);
    return await this.groupRepo.save(group);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const group = await this.findOne(tenantId, id);
    if (!group) {
      throw new NotFoundException(`Property group with ID ${id} not found`);
    }

    await this.groupRepo.remove(group);
  }

  async getStats(tenantId: string, groupId: string): Promise<any> {
    const group = await this.findOne(tenantId, groupId);
    if (!group) {
      throw new NotFoundException(`Property group with ID ${groupId} not found`);
    }

    const stats = await this.propertyRepo
      .createQueryBuilder('p')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN p.status = 'disponible' THEN 1 ELSE 0 END)", 'available')
      .addSelect("SUM(CASE WHEN p.status = 'vendido' THEN 1 ELSE 0 END)", 'sold')
      .addSelect("SUM(CASE WHEN p.status = 'reservado' THEN 1 ELSE 0 END)", 'reserved')
      .addSelect("SUM(CASE WHEN p.status = 'cancelado' THEN 1 ELSE 0 END)", 'cancelled')
      .addSelect('SUM(p.total_price)', 'total_value')
      .addSelect('SUM(p.total_area)', 'total_area')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.group_id = :groupId', { groupId })
      .getRawOne();

    return {
      group_id: groupId,
      total_properties: parseInt(stats.total) || 0,
      available_properties: parseInt(stats.available) || 0,
      sold_properties: parseInt(stats.sold) || 0,
      reserved_properties: parseInt(stats.reserved) || 0,
      cancelled_properties: parseInt(stats.cancelled) || 0,
      total_area: parseFloat(stats.total_area) || 0,
      total_value: parseFloat(stats.total_value) || 0,
    };
  }
}
