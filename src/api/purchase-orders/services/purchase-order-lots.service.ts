import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { InventoryTransferLine } from '../../../entities/inventory/inventory-transfer-line.entity';
import { User } from '../../../entities/users/user.entity';
import { formatUserDisplayName } from '../utils/user-display-name.util';
import {
  buildPurchaseOrderLotTree,
  PurchaseOrderLotNode,
  PurchaseOrderLotsSummary,
} from '../utils/purchase-order-lot-tree.util';

@Injectable()
export class PurchaseOrderLotsService {
  constructor(
    @InjectRepository(InventoryTransferLine)
    private readonly transferLineRepository: Repository<InventoryTransferLine>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async buildTree(
    batches: InventoryBatch[] | undefined,
    lineItems: PurchaseOrderBatchDetail[] | undefined,
  ): Promise<{ batches: PurchaseOrderLotNode[]; summary: PurchaseOrderLotsSummary }> {
    const list = batches ?? [];
    if (list.length === 0) {
      return {
        batches: [],
        summary: {
          received_lots: 0,
          migrated_lots: 0,
          received_quantity: '0.000',
          remaining_on_received_lots: '0.000',
          remaining_total: '0.000',
          migrated_quantity: '0.000',
          amount_total: 0,
        },
      };
    }

    const batchIds = list.map((batch) => batch.id);
    const createdByIds = [...new Set(list.map((batch) => batch.created_by).filter(Boolean))];
    const [users, transferLines] = await Promise.all([
      createdByIds.length
        ? this.userRepository.find({ where: { id: In(createdByIds) } })
        : Promise.resolve([] as User[]),
      this.transferLineRepository
        .createQueryBuilder('line')
        .leftJoinAndSelect('line.inventory_transfer', 'transfer')
        .leftJoinAndSelect('transfer.created_by_user', 'transfer_user')
        .leftJoinAndSelect('transfer.source_warehouse', 'source_wh')
        .leftJoinAndSelect('source_wh.billing_branch', 'source_branch')
        .leftJoinAndSelect('transfer.destination_warehouse', 'dest_wh')
        .leftJoinAndSelect('dest_wh.billing_branch', 'dest_branch')
        .where('line.source_inventory_batch_id IN (:...sourceIds)', { sourceIds: batchIds })
        .orWhere('line.destination_inventory_batch_id IN (:...destIds)', { destIds: batchIds })
        .orderBy('line.created_at', 'ASC')
        .getMany(),
    ]);

    const userById = new Map(users.map((user) => [user.id, user]));

    return buildPurchaseOrderLotTree(
      list.map((batch) => {
        const branch = batch.warehouse?.billing_branch ?? null;
        const fiscal = branch?.fiscal_configuration ?? null;
        return {
          id: batch.id,
          batch_number: batch.batch_number,
          transferred_from_batch_id: batch.transferred_from_batch_id ?? null,
          purchase_order_detail_id: batch.purchase_order_detail_id ?? null,
          product_id: batch.product_id,
          product_name: batch.product?.name ?? '',
          product_sku: batch.product?.sku ?? '',
          warehouse_id: batch.warehouse_id,
          warehouse_name: batch.warehouse?.name ?? '',
          fiscal_configuration_id: branch?.fiscal_configuration_id ?? fiscal?.id ?? null,
          razon_social: fiscal?.razon_social ?? null,
          billing_branch_id: batch.warehouse?.billing_branch_id ?? branch?.id ?? null,
          sucursal: branch?.code ?? null,
          uom_id: batch.uom_id,
          uom_name: batch.uom?.name ?? '',
          measure: batch.measure,
          measure_uom_id: batch.measure_uom_id,
          measure_uom_name: batch.measure_uom?.name ?? null,
          source_tag_identifier: batch.source_tag_identifier ?? null,
          initial_quantity: batch.initial_quantity,
          available_quantity: batch.available_quantity,
          created_at: batch.created_at,
          created_by: batch.created_by,
          created_by_name: formatUserDisplayName(userById.get(batch.created_by) ?? null),
        };
      }),
      (lineItems ?? []).map((line) => ({
        id: line.id,
        quantity: line.quantity,
        unit_total: line.unit_total,
        received_original_unit_total: line.received_original_unit_total,
      })),
      transferLines.map((line) => ({
        id: line.inventory_transfer_id,
        folio: line.inventory_transfer?.folio ?? '',
        quantity: line.quantity,
        source_inventory_batch_id: line.source_inventory_batch_id,
        destination_inventory_batch_id: line.destination_inventory_batch_id,
        created_at: line.created_at,
        created_by_name: formatUserDisplayName(line.inventory_transfer?.created_by_user ?? null),
        source_warehouse_name: line.inventory_transfer?.source_warehouse?.name ?? null,
        source_sucursal: line.inventory_transfer?.source_warehouse?.billing_branch?.code ?? null,
        destination_warehouse_name: line.inventory_transfer?.destination_warehouse?.name ?? null,
        destination_sucursal:
          line.inventory_transfer?.destination_warehouse?.billing_branch?.code ?? null,
      })),
    );
  }
}
