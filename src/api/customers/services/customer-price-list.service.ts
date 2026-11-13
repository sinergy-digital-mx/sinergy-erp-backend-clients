import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CustomerPriceList } from '../../../entities/customers/customer-price-list.entity';
import { Customer } from '../../../entities/customers/customer.entity';
import { PriceList } from '../../../entities/products/price-list.entity';
import { CustomerPriceListAssignmentDto } from '../dto/upsert-customer-price-lists.dto';
import { normalizeCustomerPriceListAssignments } from '../utils/customer-price-list.util';

export interface CustomerPriceListView {
  id: string;
  price_list_id: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
}

@Injectable()
export class CustomerPriceListService {
  constructor(
    @InjectRepository(CustomerPriceList)
    private readonly assignmentRepo: Repository<CustomerPriceList>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(PriceList)
    private readonly priceListRepo: Repository<PriceList>,
  ) {}

  async list(
    customerId: number,
    tenantId: string,
  ): Promise<{ price_lists: CustomerPriceListView[] }> {
    await this.requireCustomer(customerId, tenantId);
    return { price_lists: await this.loadViews(customerId, tenantId) };
  }

  async replace(
    customerId: number,
    tenantId: string,
    items: CustomerPriceListAssignmentDto[],
  ): Promise<{ price_lists: CustomerPriceListView[] }> {
    await this.requireCustomer(customerId, tenantId);
    const normalized = normalizeCustomerPriceListAssignments(items);

    if (normalized.length > 0) {
      const lists = await this.priceListRepo.find({
        where: {
          tenant_id: tenantId,
          id: In(normalized.map((item) => item.price_list_id)),
        },
      });
      if (lists.length !== normalized.length) {
        throw new BadRequestException('Una de las listas de precios no existe');
      }
      const inactive = lists.find((list) => !list.is_active);
      if (inactive) {
        throw new BadRequestException(
          `La lista ${inactive.name} no está activa`,
        );
      }
    }

    await this.assignmentRepo.manager.transaction(async (manager) => {
      await manager.delete(CustomerPriceList, {
        tenant_id: tenantId,
        customer_id: customerId,
      });
      if (normalized.length === 0) return;
      await manager.save(
        CustomerPriceList,
        normalized.map((item) =>
          manager.create(CustomerPriceList, {
            tenant_id: tenantId,
            customer_id: customerId,
            price_list_id: item.price_list_id,
            is_default: item.is_default,
          }),
        ),
      );
    });

    return { price_lists: await this.loadViews(customerId, tenantId) };
  }

  private async requireCustomer(
    customerId: number,
    tenantId: string,
  ): Promise<void> {
    const customer = await this.customerRepo.findOneBy({
      id: customerId,
      tenant_id: tenantId,
    });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }
  }

  private async loadViews(
    customerId: number,
    tenantId: string,
  ): Promise<CustomerPriceListView[]> {
    const rows = await this.assignmentRepo.find({
      where: { tenant_id: tenantId, customer_id: customerId },
      relations: { price_list: true },
      order: { is_default: 'DESC', created_at: 'ASC' },
    });
    return rows.map((row) => ({
      id: row.id,
      price_list_id: row.price_list_id,
      name: row.price_list?.name ?? '',
      is_default: row.is_default === true,
      is_active: row.price_list?.is_active !== false,
    }));
  }
}
