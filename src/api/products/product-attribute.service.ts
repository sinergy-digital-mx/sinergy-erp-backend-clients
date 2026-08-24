import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { ProductAttribute } from '../../entities/products/product-attribute.entity';
import { ProductAttributeValue } from '../../entities/products/product-attribute-value.entity';
import { CreateProductAttributeDto } from './dto/create-product-attribute.dto';
import { UpdateProductAttributeDto } from './dto/update-product-attribute.dto';
import { CreateProductAttributeValueDto } from './dto/create-product-attribute-value.dto';
import { UpdateProductAttributeValueDto } from './dto/update-product-attribute-value.dto';
import { QueryProductAttributeDto } from './dto/query-product-attribute.dto';

@Injectable()
export class ProductAttributeService {
  constructor(
    @InjectRepository(ProductAttribute)
    private readonly attributeRepository: Repository<ProductAttribute>,
    @InjectRepository(ProductAttributeValue)
    private readonly valueRepository: Repository<ProductAttributeValue>,
  ) {}

  async createAttribute(dto: CreateProductAttributeDto, tenantId: string): Promise<ProductAttribute> {
    const existing = await this.attributeRepository.findOne({
      where: { tenant_id: tenantId, name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Atributo "${dto.name}" ya existe`);
    }

    const attribute = this.attributeRepository.create({
      tenant_id: tenantId,
      name: dto.name,
      is_active: dto.is_active ?? true,
    });

    return this.attributeRepository.save(attribute);
  }

  async findOptions(tenantId: string) {
    const attributes = await this.attributeRepository.find({
      where: { tenant_id: tenantId, is_active: true },
      relations: ['values'],
      order: { name: 'ASC' },
    });

    return attributes.map((attribute) => ({
      id: attribute.id,
      name: attribute.name,
      values: (attribute.values ?? [])
        .filter((value) => value.is_active)
        .sort((a, b) => a.display_order - b.display_order || a.value.localeCompare(b.value))
        .map((value) => ({
          id: value.id,
          value: value.value,
          display_order: value.display_order,
        })),
    }));
  }

  async findAllAttributes(query: QueryProductAttributeDto, tenantId: string) {
    const { page = 1, limit = 20, search, is_active, include_values = false } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: tenantId };

    if (search) {
      where.name = Like(`%${search}%`);
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const [data, total] = await this.attributeRepository.findAndCount({
      where,
      relations: include_values ? ['values'] : [],
      order: { name: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAttributeById(id: string, tenantId: string): Promise<ProductAttribute> {
    const attribute = await this.attributeRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['values'],
    });

    if (!attribute) {
      throw new NotFoundException(`Atributo con ID ${id} no encontrado`);
    }

    return attribute;
  }

  async updateAttribute(
    id: string,
    dto: UpdateProductAttributeDto,
    tenantId: string,
  ): Promise<ProductAttribute> {
    const attribute = await this.findAttributeById(id, tenantId);

    if (dto.name && dto.name !== attribute.name) {
      const existing = await this.attributeRepository.findOne({
        where: { tenant_id: tenantId, name: dto.name },
      });

      if (existing) {
        throw new ConflictException(`Atributo "${dto.name}" ya existe`);
      }
    }

    Object.assign(attribute, dto);
    return this.attributeRepository.save(attribute);
  }

  async removeAttribute(id: string, tenantId: string): Promise<void> {
    const attribute = await this.findAttributeById(id, tenantId);
    await this.attributeRepository.remove(attribute);
  }

  async createValue(
    attributeId: string,
    dto: CreateProductAttributeValueDto,
    tenantId: string,
  ): Promise<ProductAttributeValue> {
    const attribute = await this.findAttributeById(attributeId, tenantId);

    const existing = await this.valueRepository.findOne({
      where: { attribute_id: attributeId, value: dto.value },
    });

    if (existing) {
      throw new ConflictException(`Valor "${dto.value}" ya existe para este atributo`);
    }

    const value = this.valueRepository.create({
      attribute_id: attributeId,
      value: dto.value,
      display_order: dto.display_order ?? 0,
      is_active: dto.is_active ?? true,
      attribute,
    });

    return this.valueRepository.save(value);
  }

  async findAllValues(attributeId: string, tenantId: string): Promise<ProductAttributeValue[]> {
    await this.findAttributeById(attributeId, tenantId);

    return this.valueRepository.find({
      where: { attribute_id: attributeId },
      order: { display_order: 'ASC', value: 'ASC' },
    });
  }

  async findValueById(
    id: string,
    attributeId: string,
    tenantId: string,
  ): Promise<ProductAttributeValue> {
    await this.findAttributeById(attributeId, tenantId);

    const value = await this.valueRepository.findOne({
      where: { id, attribute_id: attributeId },
    });

    if (!value) {
      throw new NotFoundException(`Valor con ID ${id} no encontrado para este atributo`);
    }

    return value;
  }

  async updateValue(
    id: string,
    attributeId: string,
    dto: UpdateProductAttributeValueDto,
    tenantId: string,
  ): Promise<ProductAttributeValue> {
    const value = await this.findValueById(id, attributeId, tenantId);

    if (dto.value && dto.value !== value.value) {
      const existing = await this.valueRepository.findOne({
        where: { attribute_id: attributeId, value: dto.value },
      });

      if (existing) {
        throw new ConflictException(`Valor "${dto.value}" ya existe para este atributo`);
      }
    }

    Object.assign(value, dto);
    return this.valueRepository.save(value);
  }

  async removeValue(id: string, attributeId: string, tenantId: string): Promise<void> {
    const value = await this.findValueById(id, attributeId, tenantId);
    await this.valueRepository.remove(value);
  }
}
