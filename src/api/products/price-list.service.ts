import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { PriceList } from '../../entities/products/price-list.entity';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';

@Injectable()
export class PriceListService {
  constructor(
    @InjectRepository(PriceList)
    private readonly priceListRepository: Repository<PriceList>,
  ) {}

  async create(dto: CreatePriceListDto, tenantId: string): Promise<PriceList> {
    const existing = await this.priceListRepository.findOne({
      where: { tenant_id: tenantId, name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Lista de precios "${dto.name}" ya existe`);
    }

    const priceList = this.priceListRepository.create({
      ...dto,
      tenant_id: tenantId,
      is_active: true,
    });

    return await this.priceListRepository.save(priceList);
  }

  async findAll(tenantId: string): Promise<PriceList[]> {
    return await this.priceListRepository.find({
      where: { tenant_id: tenantId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<PriceList> {
    const priceList = await this.priceListRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!priceList) {
      throw new NotFoundException(`Lista de precios con ID ${id} no encontrada`);
    }

    return priceList;
  }

  async update(id: string, dto: UpdatePriceListDto, tenantId: string): Promise<PriceList> {
    const priceList = await this.findOne(id, tenantId);

    if (dto.name && dto.name !== priceList.name) {
      const existing = await this.priceListRepository.findOne({
        where: { tenant_id: tenantId, name: dto.name },
      });

      if (existing) {
        throw new ConflictException(`Lista de precios "${dto.name}" ya existe`);
      }
    }

    Object.assign(priceList, dto);
    return await this.priceListRepository.save(priceList);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const priceList = await this.findOne(id, tenantId);
    await this.priceListRepository.remove(priceList);
  }
}
