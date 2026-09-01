import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Customer } from '../../../entities/customers/customer.entity';
import {
  AssignmentChangeItem,
  CustomerAssignmentChange,
} from '../../../entities/customers/customer-assignment-change.entity';
import {
  ASSIGNMENT_TYPE_LABELS,
  AssignmentHistoryRow,
  assignmentChange,
  buildAssignmentDescription,
  compactAssignmentChanges,
  formatAssignmentUserLabel,
  mapAssignmentActorName,
} from '../../../common/utils/assignment-change.util';

export type RecordCustomerAssignmentInput = {
  tenantId: string;
  customerId: number;
  actorId: string | null;
  type?: 'assignment_initialized' | 'assignment_updated';
  changes: AssignmentChangeItem[];
  occurredAt?: Date;
};

@Injectable()
export class CustomerAssignmentService {
  constructor(
    @InjectRepository(CustomerAssignmentChange)
    private readonly changeRepo: Repository<CustomerAssignmentChange>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async record(input: RecordCustomerAssignmentInput): Promise<void> {
    if (!input.changes.length) {
      return;
    }
    const type = input.type ?? 'assignment_updated';
    const activity = this.changeRepo.create({
      id: uuidv4(),
      tenant_id: input.tenantId,
      customer_id: input.customerId,
      type,
      title: ASSIGNMENT_TYPE_LABELS[type] ?? 'Cambio de asignación',
      description: buildAssignmentDescription(input.changes),
      actor_id: input.actorId,
      occurred_at: input.occurredAt ?? new Date(),
      changes: input.changes,
    });
    await this.changeRepo.save(activity);
  }

  async listForCustomer(
    customerId: number,
    tenantId: string,
  ): Promise<AssignmentHistoryRow[]> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, tenant_id: tenantId },
      select: ['id'],
    });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return this.listForExistingCustomer(customerId, tenantId);
  }

  async listForExistingCustomer(
    customerId: number,
    tenantId: string,
  ): Promise<AssignmentHistoryRow[]> {
    await this.seedCurrentAssignmentIfEmpty(customerId, tenantId);

    const rows = await this.changeRepo.find({
      where: { customer_id: customerId, tenant_id: tenantId },
      relations: ['actor'],
      order: { occurred_at: 'DESC', created_at: 'DESC' },
      take: 100,
    });
    return rows.map((row) => this.mapRow(row));
  }

  private async seedCurrentAssignmentIfEmpty(
    customerId: number,
    tenantId: string,
  ): Promise<void> {
    const existing = await this.changeRepo.count({
      where: { customer_id: customerId, tenant_id: tenantId },
    });
    if (existing > 0) {
      return;
    }

    const customer = await this.customerRepo
      .createQueryBuilder('customer')
      .leftJoin('customer.registered_fiscal_configuration', 'fiscal')
      .addSelect(['fiscal.id', 'fiscal.razon_social'])
      .leftJoinAndSelect('customer.registered_billing_branch', 'branch')
      .leftJoin('customer.assigned_seller_user', 'seller')
      .addSelect([
        'seller.id',
        'seller.first_name',
        'seller.last_name',
        'seller.email',
        'seller.pos_user_code',
      ])
      .where('customer.id = :customerId', { customerId })
      .andWhere('customer.tenant_id = :tenantId', { tenantId })
      .getOne();

    if (!customer) {
      return;
    }

    const changes = compactAssignmentChanges([
      assignmentChange(
        'registered_fiscal_configuration_id',
        'Razón social de registro',
        null,
        customer.registered_fiscal_configuration?.razon_social ?? null,
        null,
        customer.registered_fiscal_configuration_id,
      ),
      assignmentChange(
        'registered_billing_branch_id',
        'Sucursal de registro',
        null,
        customer.registered_billing_branch?.code ?? null,
        null,
        customer.registered_billing_branch_id,
      ),
      assignmentChange(
        'assigned_seller_user_id',
        'Vendedor asignado',
        null,
        formatAssignmentUserLabel(customer.assigned_seller_user),
        null,
        customer.assigned_seller_user_id,
      ),
    ]);

    if (!changes.length) {
      return;
    }

    await this.record({
      tenantId,
      customerId,
      actorId: customer.registered_by_user_id,
      type: 'assignment_initialized',
      changes,
      occurredAt: customer.created_at,
    });
  }

  private mapRow(row: CustomerAssignmentChange): AssignmentHistoryRow {
    return {
      id: row.id,
      type: row.type,
      type_label: ASSIGNMENT_TYPE_LABELS[row.type] ?? row.title,
      title: row.title,
      description: row.description,
      actor_id: row.actor_id,
      actor_name: mapAssignmentActorName(row.actor),
      occurred_at: row.occurred_at,
      changes: row.changes ?? [],
    };
  }
}
