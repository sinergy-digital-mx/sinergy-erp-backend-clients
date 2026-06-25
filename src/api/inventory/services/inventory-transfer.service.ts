import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { InventoryTransfer } from '../../../entities/inventory/inventory-transfer.entity';
import { InventoryTransferLine } from '../../../entities/inventory/inventory-transfer-line.entity';
import { InventoryTransferStatus } from '../../../entities/inventory/inventory-transfer-status.enum';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { Warehouse } from '../../../entities/warehouse/warehouse.entity';
import { BatchNumberGeneratorService } from '../../purchase-orders/services/batch-number-generator.service';
import { InventoryTransferFolioService } from './inventory-transfer-folio.service';
import { CreateInventoryTransferDto } from '../dto/create-inventory-transfer.dto';
import { QueryInventoryTransferDto } from '../dto/query-inventory-transfer.dto';
import {
  InventoryTransferListResponseDto,
  InventoryTransferResponseDto,
} from '../dto/inventory-transfer-response.dto';
import { TransferContextResponseDto } from '../dto/transfer-context-response.dto';

@Injectable()
export class InventoryTransferService {
  private readonly logger = new Logger(InventoryTransferService.name);

  constructor(
    @InjectRepository(InventoryTransfer)
    private readonly transferRepo: Repository<InventoryTransfer>,
    @InjectRepository(InventoryBatch)
    private readonly batchRepo: Repository<InventoryBatch>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepo: Repository<Warehouse>,
    private readonly folioService: InventoryTransferFolioService,
    private readonly batchNumberGenerator: BatchNumberGeneratorService,
    private readonly dataSource: DataSource,
  ) {}

  async getTransferContext(
    tenantId: string,
    productId: string,
    warehouseId: string,
  ): Promise<TransferContextResponseDto> {
    const warehouse = await this.warehouseRepo.findOne({
      where: { id: warehouseId, tenant_id: tenantId },
      relations: ['billing_branch'],
    });

    if (!warehouse) {
      throw new NotFoundException('Almacén de origen no encontrado');
    }

    const batches = await this.batchRepo
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .leftJoinAndSelect('batch.uom', 'uom')
      .leftJoinAndSelect('batch.purchase_order_batch', 'po')
      .where('batch.tenant_id = :tenantId', { tenantId })
      .andWhere('batch.product_id = :productId', { productId })
      .andWhere('batch.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('batch.available_quantity > 0')
      .orderBy('batch.created_at', 'ASC')
      .getMany();

    if (batches.length === 0) {
      throw new NotFoundException(
        'No hay lotes con stock disponible para este producto en el almacén seleccionado',
      );
    }

    const first = batches[0];
    const totalAvailable = batches.reduce(
      (sum, b) => sum + parseFloat(b.available_quantity?.toString() ?? '0'),
      0,
    );

    return {
      product_id: first.product_id,
      product_name: first.product?.name ?? '',
      product_sku: first.product?.sku ?? '',
      uom_id: first.uom_id,
      uom_name: first.uom?.name ?? '',
      total_available_quantity: totalAvailable.toFixed(3),
      total_batches: batches.length,
      source_warehouse: {
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code ?? null,
        billing_branch_id: warehouse.billing_branch_id ?? null,
        billing_branch: warehouse.billing_branch
          ? {
              id: warehouse.billing_branch.id,
              code: warehouse.billing_branch.code,
              city: warehouse.billing_branch.city,
              state: warehouse.billing_branch.state,
            }
          : null,
      },
      batches: batches.map((b) => ({
        batch_id: b.id,
        batch_number: b.batch_number,
        source_tag_identifier: b.source_tag_identifier ?? null,
        available_quantity: parseFloat(b.available_quantity?.toString() ?? '0').toFixed(3),
        initial_quantity: parseFloat(b.initial_quantity?.toString() ?? '0').toFixed(3),
        purchase_order_folio: b.purchase_order_batch?.folio ?? null,
        created_at: b.created_at,
      })),
    };
  }

  async create(
    dto: CreateInventoryTransferDto,
    tenantId: string,
    userId: string,
  ): Promise<InventoryTransferResponseDto> {
    if (dto.source_warehouse_id === dto.destination_warehouse_id) {
      throw new BadRequestException(
        'El almacén de origen y destino deben ser diferentes',
      );
    }

    const uniqueBatchIds = new Set(dto.lines.map((l) => l.inventory_batch_id));
    if (uniqueBatchIds.size !== dto.lines.length) {
      throw new BadRequestException('No se puede repetir el mismo lote en las líneas');
    }

    const totalRequested = dto.lines.reduce((sum, line) => sum + line.quantity, 0);
    if (totalRequested <= 0) {
      throw new BadRequestException('La cantidad total a transferir debe ser mayor a cero');
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const sourceWarehouse = await qr.manager.findOne(Warehouse, {
        where: { id: dto.source_warehouse_id, tenant_id: tenantId },
      });
      const destinationWarehouse = await qr.manager.findOne(Warehouse, {
        where: { id: dto.destination_warehouse_id, tenant_id: tenantId },
      });

      if (!sourceWarehouse) {
        throw new NotFoundException('Almacén de origen no encontrado');
      }
      if (!destinationWarehouse) {
        throw new NotFoundException('Almacén de destino no encontrado');
      }
      if (destinationWarehouse.status !== 'active') {
        throw new BadRequestException('El almacén de destino no está activo');
      }

      const folio = await this.folioService.generateFolio(tenantId);
      const transfer = qr.manager.create(InventoryTransfer, {
        id: uuidv4(),
        tenant_id: tenantId,
        folio,
        product_id: dto.product_id,
        uom_id: dto.uom_id,
        source_warehouse_id: dto.source_warehouse_id,
        destination_warehouse_id: dto.destination_warehouse_id,
        total_quantity: parseFloat(totalRequested.toFixed(3)),
        status: InventoryTransferStatus.COMPLETED,
        notes: dto.notes ?? null,
        created_by: userId,
      });
      await qr.manager.save(InventoryTransfer, transfer);

      for (const lineDto of dto.lines) {
        const sourceBatch = await qr.manager
          .createQueryBuilder(InventoryBatch, 'batch')
          .where('batch.id = :id', { id: lineDto.inventory_batch_id })
          .andWhere('batch.tenant_id = :tenantId', { tenantId })
          .setLock('pessimistic_write')
          .getOne();

        if (!sourceBatch) {
          throw new NotFoundException(`Lote no encontrado: ${lineDto.inventory_batch_id}`);
        }

        if (sourceBatch.warehouse_id !== dto.source_warehouse_id) {
          throw new BadRequestException(
            `El lote ${sourceBatch.batch_number} no pertenece al almacén de origen`,
          );
        }

        if (sourceBatch.product_id !== dto.product_id) {
          throw new BadRequestException(
            `El lote ${sourceBatch.batch_number} no corresponde al producto seleccionado`,
          );
        }

        if (sourceBatch.uom_id !== dto.uom_id) {
          throw new BadRequestException(
            `El lote ${sourceBatch.batch_number} no corresponde a la unidad de medida seleccionada`,
          );
        }

        const available = parseFloat(sourceBatch.available_quantity.toString());
        const requested = parseFloat(lineDto.quantity.toFixed(3));

        if (requested <= 0) {
          throw new BadRequestException(
            `La cantidad del lote ${sourceBatch.batch_number} debe ser mayor a cero`,
          );
        }

        if (requested > available) {
          throw new BadRequestException(
            `Stock insuficiente en lote ${sourceBatch.batch_number}. ` +
              `Disponible: ${available}, solicitado: ${requested}`,
          );
        }

        sourceBatch.available_quantity = parseFloat((available - requested).toFixed(3)) as any;
        await qr.manager.save(InventoryBatch, sourceBatch);

        const destBatchNumber = await this.batchNumberGenerator.generateBatchNumber(
          dto.destination_warehouse_id,
          tenantId,
        );

        const destinationBatch = qr.manager.create(InventoryBatch, {
          id: uuidv4(),
          tenant_id: tenantId,
          batch_number: destBatchNumber,
          source_tag_identifier: sourceBatch.source_tag_identifier,
          photo: sourceBatch.photo,
          warehouse_id: dto.destination_warehouse_id,
          product_id: sourceBatch.product_id,
          uom_id: sourceBatch.uom_id,
          initial_quantity: requested,
          available_quantity: requested,
          purchase_order_batch_id: sourceBatch.purchase_order_batch_id,
          purchase_order_detail_id: sourceBatch.purchase_order_detail_id,
          transferred_from_batch_id: sourceBatch.id,
          created_by: userId,
        });
        await qr.manager.save(InventoryBatch, destinationBatch);

        const line = qr.manager.create(InventoryTransferLine, {
          id: uuidv4(),
          inventory_transfer_id: transfer.id,
          source_inventory_batch_id: sourceBatch.id,
          quantity: requested,
          destination_inventory_batch_id: destinationBatch.id,
        });
        await qr.manager.save(InventoryTransferLine, line);
      }

      await qr.commitTransaction();

      this.logger.log(
        `Transfer ${folio} created: ${totalRequested} units from ${dto.source_warehouse_id} to ${dto.destination_warehouse_id}`,
      );

      return this.findById(transfer.id, tenantId);
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  async findAll(
    tenantId: string,
    filters: QueryInventoryTransferDto,
  ): Promise<InventoryTransferListResponseDto> {
    const query = this.transferRepo
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.product', 'product')
      .leftJoinAndSelect('transfer.uom', 'uom')
      .leftJoinAndSelect('transfer.source_warehouse', 'source_warehouse')
      .leftJoinAndSelect('source_warehouse.billing_branch', 'source_branch')
      .leftJoinAndSelect('transfer.destination_warehouse', 'destination_warehouse')
      .leftJoinAndSelect('destination_warehouse.billing_branch', 'dest_branch')
      .leftJoinAndSelect('transfer.created_by_user', 'created_by_user')
      .leftJoinAndSelect('transfer.lines', 'lines')
      .leftJoinAndSelect('lines.source_inventory_batch', 'source_batch')
      .leftJoinAndSelect('lines.destination_inventory_batch', 'dest_batch')
      .where('transfer.tenant_id = :tenantId', { tenantId });

    if (filters.search) {
      query.andWhere(
        '(LOWER(transfer.folio) LIKE LOWER(:search) OR LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.sku) LIKE LOWER(:search))',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.product_id) {
      query.andWhere('transfer.product_id = :productId', { productId: filters.product_id });
    }

    if (filters.source_warehouse_id) {
      query.andWhere('transfer.source_warehouse_id = :sourceWarehouseId', {
        sourceWarehouseId: filters.source_warehouse_id,
      });
    }

    if (filters.destination_warehouse_id) {
      query.andWhere('transfer.destination_warehouse_id = :destinationWarehouseId', {
        destinationWarehouseId: filters.destination_warehouse_id,
      });
    }

    if (filters.source_billing_branch_id) {
      query.andWhere('source_warehouse.billing_branch_id = :sourceBranchId', {
        sourceBranchId: filters.source_billing_branch_id,
      });
    }

    if (filters.destination_billing_branch_id) {
      query.andWhere('destination_warehouse.billing_branch_id = :destBranchId', {
        destBranchId: filters.destination_billing_branch_id,
      });
    }

    if (filters.created_from) {
      query.andWhere('transfer.created_at >= :createdFrom', {
        createdFrom: new Date(filters.created_from),
      });
    }

    if (filters.created_to) {
      query.andWhere('transfer.created_at <= :createdTo', {
        createdTo: new Date(filters.created_to),
      });
    }

    const sortBy = filters.sort_by || 'created_at';
    const allowedSort = ['created_at', 'folio', 'total_quantity'];
    const orderColumn = allowedSort.includes(sortBy) ? `transfer.${sortBy}` : 'transfer.created_at';
    query.orderBy(orderColumn, filters.sort_order === 'ASC' ? 'ASC' : 'DESC');

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map((t) => this.mapToResponseDto(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, tenantId: string): Promise<InventoryTransferResponseDto> {
    const transfer = await this.transferRepo
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.product', 'product')
      .leftJoinAndSelect('transfer.uom', 'uom')
      .leftJoinAndSelect('transfer.source_warehouse', 'source_warehouse')
      .leftJoinAndSelect('source_warehouse.billing_branch', 'source_branch')
      .leftJoinAndSelect('transfer.destination_warehouse', 'destination_warehouse')
      .leftJoinAndSelect('destination_warehouse.billing_branch', 'dest_branch')
      .leftJoinAndSelect('transfer.created_by_user', 'created_by_user')
      .leftJoinAndSelect('transfer.lines', 'lines')
      .leftJoinAndSelect('lines.source_inventory_batch', 'source_batch')
      .leftJoinAndSelect('lines.destination_inventory_batch', 'dest_batch')
      .where('transfer.id = :id AND transfer.tenant_id = :tenantId', { id, tenantId })
      .getOne();

    if (!transfer) {
      throw new NotFoundException('Transferencia no encontrada');
    }

    return this.mapToResponseDto(transfer);
  }

  private mapToResponseDto(transfer: InventoryTransfer): InventoryTransferResponseDto {
    return {
      id: transfer.id,
      folio: transfer.folio,
      product_id: transfer.product_id,
      product_name: transfer.product?.name ?? '',
      product_sku: transfer.product?.sku ?? '',
      uom_id: transfer.uom_id,
      uom_name: transfer.uom?.name ?? '',
      source_warehouse: {
        id: transfer.source_warehouse_id,
        name: transfer.source_warehouse?.name ?? '',
        code: transfer.source_warehouse?.code ?? null,
        billing_branch_id: transfer.source_warehouse?.billing_branch_id ?? null,
        billing_branch_code: transfer.source_warehouse?.billing_branch?.code ?? null,
      },
      destination_warehouse: {
        id: transfer.destination_warehouse_id,
        name: transfer.destination_warehouse?.name ?? '',
        code: transfer.destination_warehouse?.code ?? null,
        billing_branch_id: transfer.destination_warehouse?.billing_branch_id ?? null,
        billing_branch_code: transfer.destination_warehouse?.billing_branch?.code ?? null,
      },
      total_quantity: parseFloat(transfer.total_quantity?.toString() ?? '0').toFixed(3),
      status: transfer.status,
      notes: transfer.notes,
      created_by_user: {
        id: transfer.created_by,
        name: [transfer.created_by_user?.first_name, transfer.created_by_user?.last_name]
          .filter(Boolean)
          .join(' ')
          .trim(),
        email: transfer.created_by_user?.email ?? '',
      },
      created_at: transfer.created_at,
      lines: (transfer.lines ?? []).map((line) => ({
        id: line.id,
        source_inventory_batch_id: line.source_inventory_batch_id,
        source_batch_number: line.source_inventory_batch?.batch_number ?? '',
        destination_inventory_batch_id: line.destination_inventory_batch_id,
        destination_batch_number: line.destination_inventory_batch?.batch_number ?? '',
        quantity: parseFloat(line.quantity?.toString() ?? '0').toFixed(3),
        created_at: line.created_at,
      })),
    };
  }
}
