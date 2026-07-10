import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GlobalDiscount,
  GlobalDiscountType,
} from '../../entities/global-discounts/global-discount.entity';
import { CreateGlobalDiscountDto } from './dto/create-global-discount.dto';
import { UpdateGlobalDiscountDto } from './dto/update-global-discount.dto';
import {
  isGlobalDiscountApplicable,
  mapApplicableGlobalDiscount,
} from './utils/global-discount.util';

@Injectable()
export class GlobalDiscountService {
  constructor(
    @InjectRepository(GlobalDiscount)
    private readonly globalDiscountRepository: Repository<GlobalDiscount>,
  ) {}

  private validateDiscountValue(discountType: GlobalDiscountType, value: number): void {
    if (value <= 0) {
      throw new BadRequestException('El valor del descuento debe ser mayor a 0');
    }
    if (discountType === GlobalDiscountType.PERCENTAGE && value > 100) {
      throw new BadRequestException('El porcentaje de descuento no puede ser mayor a 100');
    }
  }

  private validateDateRange(validFrom?: string | null, validTo?: string | null): void {
    if (validFrom && validTo && new Date(validFrom) > new Date(validTo)) {
      throw new BadRequestException('valid_from debe ser anterior o igual a valid_to');
    }
  }

  async create(dto: CreateGlobalDiscountDto, tenantId: string): Promise<GlobalDiscount> {
    this.validateDiscountValue(dto.discount_type, dto.value);
    this.validateDateRange(dto.valid_from, dto.valid_to);

    const existing = await this.globalDiscountRepository.findOne({
      where: { tenant_id: tenantId, name: dto.name.trim() },
    });
    if (existing) {
      throw new ConflictException('Ya existe un descuento global con ese nombre');
    }

    const discount = this.globalDiscountRepository.create({
      ...dto,
      name: dto.name.trim(),
      tenant_id: tenantId,
      valid_from: dto.valid_from ? new Date(dto.valid_from) : null,
      valid_to: dto.valid_to ? new Date(dto.valid_to) : null,
    });

    return this.globalDiscountRepository.save(discount);
  }

  async findAll(tenantId: string): Promise<GlobalDiscount[]> {
    return this.globalDiscountRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'ASC' },
    });
  }

  async findApplicable(tenantId: string) {
    const discounts = await this.findAll(tenantId);
    return discounts
      .filter((discount) => isGlobalDiscountApplicable(discount))
      .map(mapApplicableGlobalDiscount);
  }

  async findOne(id: string, tenantId: string): Promise<GlobalDiscount> {
    const discount = await this.globalDiscountRepository.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!discount) {
      throw new NotFoundException(`Descuento global con ID ${id} no encontrado`);
    }
    return discount;
  }

  async findByIdForOrder(id: string, tenantId: string): Promise<GlobalDiscount> {
    return this.findOne(id, tenantId);
  }

  async update(
    id: string,
    dto: UpdateGlobalDiscountDto,
    tenantId: string,
  ): Promise<GlobalDiscount> {
    const discount = await this.findOne(id, tenantId);

    const nextType = dto.discount_type ?? discount.discount_type;
    const nextValue = dto.value ?? Number(discount.value);
    this.validateDiscountValue(nextType, nextValue);
    this.validateDateRange(
      dto.valid_from ?? (discount.valid_from ? discount.valid_from.toISOString().slice(0, 10) : null),
      dto.valid_to ?? (discount.valid_to ? discount.valid_to.toISOString().slice(0, 10) : null),
    );

    if (dto.name && dto.name.trim() !== discount.name) {
      const duplicate = await this.globalDiscountRepository.findOne({
        where: { tenant_id: tenantId, name: dto.name.trim() },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('Ya existe un descuento global con ese nombre');
      }
    }

    Object.assign(discount, {
      ...dto,
      name: dto.name?.trim() ?? discount.name,
      valid_from:
        dto.valid_from !== undefined
          ? dto.valid_from
            ? new Date(dto.valid_from)
            : null
          : discount.valid_from,
      valid_to:
        dto.valid_to !== undefined
          ? dto.valid_to
            ? new Date(dto.valid_to)
            : null
          : discount.valid_to,
    });

    return this.globalDiscountRepository.save(discount);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const discount = await this.findOne(id, tenantId);
    await this.globalDiscountRepository.remove(discount);
  }
}
