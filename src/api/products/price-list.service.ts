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

    return this.priceListRepository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(PriceList);
      if (dto.is_margin_default === true) {
        await repo.update({ tenant_id: tenantId }, { is_margin_default: false });
      }

      const priceList = repo.create({
        name: dto.name,
        description: dto.description,
        list_number: dto.list_number ?? null,
        margin_percent: dto.margin_percent ?? null,
        tenant_id: tenantId,
        is_active: true,
        is_margin_default: dto.is_margin_default === true,
      });

      return this.normalize(await repo.save(priceList));
    });
  }

  async findAll(tenantId: string): Promise<PriceList[]> {
    const rows = await this.priceListRepository.find({
      where: { tenant_id: tenantId },
    });
    return rows.map((row) => this.normalize(row)).sort((a, b) => {
      const aNumber = a.list_number == null ? Number.MAX_SAFE_INTEGER : a.list_number;
      const bNumber = b.list_number == null ? Number.MAX_SAFE_INTEGER : b.list_number;
      if (aNumber !== bNumber) return aNumber - bNumber;
      return a.name.localeCompare(b.name, 'es');
    });
  }

  async findOne(id: string, tenantId: string): Promise<PriceList> {
    const priceList = await this.priceListRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!priceList) {
      throw new NotFoundException(`Lista de precios con ID ${id} no encontrada`);
    }

    return this.normalize(priceList);
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

    if (dto.name !== undefined) priceList.name = dto.name;
    if (dto.description !== undefined) priceList.description = dto.description;
    if (dto.list_number !== undefined) priceList.list_number = dto.list_number;
    if (dto.margin_percent !== undefined) priceList.margin_percent = dto.margin_percent;
    if (dto.is_margin_default !== undefined) {
      priceList.is_margin_default = dto.is_margin_default === true;
    }

    if (dto.is_margin_default === true) {
      await this.priceListRepository.manager.transaction(async (manager) => {
        await manager.update(PriceList, { tenant_id: tenantId }, { is_margin_default: false });
        await manager.save(priceList);
      });
      return this.normalize(priceList);
    }

    return this.normalize(await this.priceListRepository.save(priceList));
  }

  private normalize(list: PriceList): PriceList {
    list.list_number = list.list_number == null ? null : Number(list.list_number);
    list.margin_percent = list.margin_percent == null ? null : Number(list.margin_percent);
    list.is_margin_default = list.is_margin_default === true || Number(list.is_margin_default) === 1;
    return list;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const priceList = await this.findOne(id, tenantId);
    await this.priceListRepository.remove(priceList);
  }
}
