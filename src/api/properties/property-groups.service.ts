import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyGroup } from '../../entities/properties/property-group.entity';
import { CreatePropertyGroupDto } from './dto/create-property-group.dto';
import { UpdatePropertyGroupDto } from './dto/update-property-group.dto';

@Injectable()
export class PropertyGroupsService {
  constructor(
    @InjectRepository(PropertyGroup)
    private groupRepo: Repository<PropertyGroup>,
  ) {}

  async create(tenantId: string, dto: CreatePropertyGroupDto): Promise<PropertyGroup> {
    const group = this.groupRepo.create({
      ...dto,
      tenant_id: tenantId,
    });

    return this.groupRepo.save(group);
  }

  async findAll(tenantId: string): Promise<PropertyGroup[]> {
    return this.groupRepo.find({
      where: { tenant_id: tenantId },
      relations: ['properties'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<PropertyGroup | null> {
    return this.groupRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['properties'],
    });
  }

  async update(tenantId: string, id: string, dto: UpdatePropertyGroupDto): Promise<PropertyGroup> {
    const group = await this.findOne(tenantId, id);
    if (!group) {
      throw new Error('Property group not found');
    }

    Object.assign(group, dto);
    return this.groupRepo.save(group);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const group = await this.findOne(tenantId, id);
    if (!group) {
      throw new Error('Property group not found');
    }

    await this.groupRepo.remove(group);
  }

  async getGroupStats(tenantId: string): Promise<any> {
    const groups = await this.findAll(tenantId);

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      total_properties: group.total_properties,
      available_properties: group.available_properties,
      sold_properties: group.sold_properties,
      total_area: group.total_area,
    }));
  }
}
