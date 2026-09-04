"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var InventoryAuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryAuditService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const inventory_audit_entity_1 = require("../../../entities/inventory/inventory-audit.entity");
const inventory_audit_line_entity_1 = require("../../../entities/inventory/inventory-audit-line.entity");
const inventory_audit_status_enum_1 = require("../../../entities/inventory/inventory-audit-status.enum");
const inventory_batch_entity_1 = require("../../../entities/purchase-orders/inventory-batch.entity");
const warehouse_entity_1 = require("../../../entities/warehouse/warehouse.entity");
const inventory_measure_util_1 = require("../utils/inventory-measure.util");
const inventory_audit_folio_service_1 = require("./inventory-audit-folio.service");
const inventory_stock_ledger_service_1 = require("./inventory-stock-ledger.service");
const inventory_stock_ledger_movement_type_enum_1 = require("../../../entities/inventory/inventory-stock-ledger-movement-type.enum");
const OPEN_STATUSES = [inventory_audit_status_enum_1.InventoryAuditStatus.DRAFT, inventory_audit_status_enum_1.InventoryAuditStatus.SUBMITTED];
const VARIANCE_EPSILON = 0.001;
let InventoryAuditService = InventoryAuditService_1 = class InventoryAuditService {
    auditRepo;
    lineRepo;
    batchRepo;
    warehouseRepo;
    folioService;
    stockLedger;
    dataSource;
    logger = new common_1.Logger(InventoryAuditService_1.name);
    constructor(auditRepo, lineRepo, batchRepo, warehouseRepo, folioService, stockLedger, dataSource) {
        this.auditRepo = auditRepo;
        this.lineRepo = lineRepo;
        this.batchRepo = batchRepo;
        this.warehouseRepo = warehouseRepo;
        this.folioService = folioService;
        this.stockLedger = stockLedger;
        this.dataSource = dataSource;
    }
    async getContext(tenantId, warehouseId, productId) {
        const warehouse = await this.requireWarehouse(tenantId, warehouseId);
        const batches = await this.loadSnapshotBatches(tenantId, warehouseId, productId, false);
        const open = await this.findOpenAudit(tenantId, warehouseId, productId);
        const totalAvailable = batches.reduce((sum, batch) => sum + this.parseQty(batch.available_quantity), 0);
        return {
            warehouse: this.mapWarehouseSummary(warehouse, warehouseId),
            total_batches: batches.length,
            total_available_quantity: this.formatQty(totalAvailable),
            open_audit_id: open?.id ?? null,
            open_audit_folio: open?.folio ?? null,
            batches: batches.map((batch) => ({
                batch_id: batch.id,
                batch_number: batch.batch_number,
                source_tag_identifier: batch.source_tag_identifier ?? null,
                ...(0, inventory_measure_util_1.mapBatchMeasure)(batch),
                product_id: batch.product_id,
                product_name: batch.product?.name ?? '',
                product_sku: batch.product?.sku ?? '',
                uom_id: batch.uom_id,
                uom_name: batch.uom?.name ?? '',
                available_quantity: this.formatQty(this.parseQty(batch.available_quantity)),
                initial_quantity: this.formatQty(this.parseQty(batch.initial_quantity)),
                purchase_order_folio: batch.purchase_order_batch?.folio ?? null,
                created_at: batch.created_at,
            })),
        };
    }
    async create(dto, tenantId, userId) {
        await this.requireWarehouse(tenantId, dto.warehouse_id);
        const open = await this.findOpenAudit(tenantId, dto.warehouse_id, dto.product_id);
        if (open) {
            throw new common_1.BadRequestException(`Ya existe una auditoría abierta (${open.folio}) para este almacén${dto.product_id ? ' y producto' : ''}. Ciérrala o cancélala antes de crear otra.`);
        }
        const includeEmpty = dto.include_empty_lots === true;
        const batches = await this.loadSnapshotBatches(tenantId, dto.warehouse_id, dto.product_id, includeEmpty);
        if (batches.length === 0) {
            throw new common_1.BadRequestException(includeEmpty
                ? 'No hay lotes en el almacén seleccionado'
                : 'No hay lotes con existencia en el almacén seleccionado');
        }
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const stillOpen = await this.findOpenAudit(tenantId, dto.warehouse_id, dto.product_id, qr.manager.getRepository(inventory_audit_entity_1.InventoryAudit));
            if (stillOpen) {
                throw new common_1.BadRequestException(`Ya existe una auditoría abierta (${stillOpen.folio}) para este alcance`);
            }
            const folio = await this.folioService.generateFolio(tenantId);
            const audit = qr.manager.create(inventory_audit_entity_1.InventoryAudit, {
                id: (0, uuid_1.v4)(),
                tenant_id: tenantId,
                folio,
                warehouse_id: dto.warehouse_id,
                product_id: dto.product_id ?? null,
                include_empty_lots: includeEmpty,
                status: inventory_audit_status_enum_1.InventoryAuditStatus.DRAFT,
                notes: dto.notes ?? null,
                created_by: userId,
            });
            await qr.manager.save(inventory_audit_entity_1.InventoryAudit, audit);
            for (const batch of batches) {
                const systemQty = this.roundQty(this.parseQty(batch.available_quantity));
                const line = qr.manager.create(inventory_audit_line_entity_1.InventoryAuditLine, {
                    id: (0, uuid_1.v4)(),
                    inventory_audit_id: audit.id,
                    inventory_batch_id: batch.id,
                    system_quantity: systemQty,
                    counted_quantity: null,
                    variance: null,
                    reason: null,
                    is_additional: false,
                });
                await qr.manager.save(inventory_audit_line_entity_1.InventoryAuditLine, line);
            }
            await qr.commitTransaction();
            this.logger.log(`Auditoría ${folio} creada: ${batches.length} lotes en almacén ${dto.warehouse_id}`);
            return this.findById(audit.id, tenantId);
        }
        catch (error) {
            await qr.rollbackTransaction();
            throw error;
        }
        finally {
            await qr.release();
        }
    }
    async updateLines(id, dto, tenantId, userId) {
        const audit = await this.requireAudit(id, tenantId);
        this.assertStatus(audit, [inventory_audit_status_enum_1.InventoryAuditStatus.DRAFT], 'capturar conteo');
        const uniqueIds = new Set(dto.lines.map((line) => line.id));
        if (uniqueIds.size !== dto.lines.length) {
            throw new common_1.BadRequestException('No se puede repetir la misma línea');
        }
        const existing = await this.lineRepo.find({
            where: { inventory_audit_id: audit.id, id: (0, typeorm_2.In)([...uniqueIds]) },
        });
        if (existing.length !== uniqueIds.size) {
            throw new common_1.NotFoundException('Una o más líneas no pertenecen a esta auditoría');
        }
        const now = new Date();
        for (const input of dto.lines) {
            const line = existing.find((item) => item.id === input.id);
            if (!line) {
                continue;
            }
            const counted = this.roundQty(input.counted_quantity);
            const systemQty = this.parseQty(line.system_quantity);
            const variance = this.roundQty(counted - systemQty);
            line.counted_quantity = counted;
            line.variance = variance;
            line.reason = this.normalizeReason(input.reason);
            line.counted_by = userId;
            line.counted_at = now;
            await this.lineRepo.save(line);
        }
        return this.findById(audit.id, tenantId);
    }
    async addLine(id, dto, tenantId) {
        const audit = await this.requireAudit(id, tenantId);
        this.assertStatus(audit, [inventory_audit_status_enum_1.InventoryAuditStatus.DRAFT], 'agregar lotes');
        const already = await this.lineRepo.findOne({
            where: {
                inventory_audit_id: audit.id,
                inventory_batch_id: dto.inventory_batch_id,
            },
        });
        if (already) {
            throw new common_1.BadRequestException('Ese lote ya está en esta auditoría');
        }
        const batch = await this.batchRepo.findOne({
            where: { id: dto.inventory_batch_id, tenant_id: tenantId },
        });
        if (!batch) {
            throw new common_1.NotFoundException('Lote no encontrado');
        }
        if (batch.warehouse_id !== audit.warehouse_id) {
            throw new common_1.BadRequestException('El lote no pertenece al almacén de la auditoría');
        }
        if (audit.product_id && batch.product_id !== audit.product_id) {
            throw new common_1.BadRequestException('El lote no corresponde al producto de esta auditoría');
        }
        const systemQty = this.roundQty(this.parseQty(batch.available_quantity));
        await this.lineRepo.save(this.lineRepo.create({
            id: (0, uuid_1.v4)(),
            inventory_audit_id: audit.id,
            inventory_batch_id: batch.id,
            system_quantity: systemQty,
            counted_quantity: null,
            variance: null,
            is_additional: true,
        }));
        return this.findById(audit.id, tenantId);
    }
    async submit(id, tenantId, userId) {
        const audit = await this.requireAudit(id, tenantId, true);
        this.assertStatus(audit, [inventory_audit_status_enum_1.InventoryAuditStatus.DRAFT], 'enviar a autorización');
        const lines = audit.lines ?? [];
        if (lines.length === 0) {
            throw new common_1.BadRequestException('La auditoría no tiene líneas para enviar');
        }
        const pending = lines.filter((line) => line.counted_quantity === null);
        if (pending.length > 0) {
            throw new common_1.BadRequestException(`Faltan ${pending.length} lote(s) por contar antes de enviar a autorización`);
        }
        const missingReason = lines.filter((line) => {
            const variance = this.parseQty(line.variance);
            return Math.abs(variance) >= VARIANCE_EPSILON && !this.normalizeReason(line.reason);
        });
        if (missingReason.length > 0) {
            throw new common_1.BadRequestException(`${missingReason.length} lote(s) con diferencia requieren motivo de corrección`);
        }
        audit.status = inventory_audit_status_enum_1.InventoryAuditStatus.SUBMITTED;
        audit.submitted_by = userId;
        audit.submitted_at = new Date();
        await this.auditRepo.save(audit);
        return this.findById(audit.id, tenantId);
    }
    async authorize(id, dto, tenantId, userId) {
        const audit = await this.requireAudit(id, tenantId);
        this.assertStatus(audit, [inventory_audit_status_enum_1.InventoryAuditStatus.SUBMITTED], 'autorizar');
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const locked = await qr.manager
                .createQueryBuilder(inventory_audit_entity_1.InventoryAudit, 'audit')
                .where('audit.id = :id AND audit.tenant_id = :tenantId', { id, tenantId })
                .setLock('pessimistic_write')
                .getOne();
            if (!locked) {
                throw new common_1.NotFoundException('Auditoría no encontrada');
            }
            if (locked.status !== inventory_audit_status_enum_1.InventoryAuditStatus.SUBMITTED) {
                throw new common_1.BadRequestException('Solo se puede autorizar una auditoría en revisión');
            }
            const lines = await qr.manager.find(inventory_audit_line_entity_1.InventoryAuditLine, {
                where: { inventory_audit_id: locked.id },
            });
            const authorizedAt = new Date();
            for (const line of lines) {
                if (line.counted_quantity === null) {
                    throw new common_1.BadRequestException('Hay líneas sin cantidad contada');
                }
                const batch = await qr.manager
                    .createQueryBuilder(inventory_batch_entity_1.InventoryBatch, 'batch')
                    .where('batch.id = :id', { id: line.inventory_batch_id })
                    .andWhere('batch.tenant_id = :tenantId', { tenantId })
                    .setLock('pessimistic_write')
                    .getOne();
                if (!batch) {
                    throw new common_1.NotFoundException(`Lote no encontrado: ${line.inventory_batch_id}`);
                }
                const counted = this.roundQty(this.parseQty(line.counted_quantity));
                const before = this.roundQty(this.parseQty(batch.available_quantity));
                batch.available_quantity = counted;
                await qr.manager.save(inventory_batch_entity_1.InventoryBatch, batch);
                line.quantity_before_post = before;
                line.quantity_after_post = counted;
                await qr.manager.save(inventory_audit_line_entity_1.InventoryAuditLine, line);
                const delta = this.roundQty(counted - before);
                await this.stockLedger.append({
                    tenantId,
                    productId: batch.product_id,
                    warehouseId: batch.warehouse_id,
                    uomId: batch.uom_id,
                    inventoryBatchId: batch.id,
                    movementType: inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.AUDIT_ADJUSTMENT,
                    quantityDelta: delta,
                    occurredAt: authorizedAt,
                    referenceType: inventory_stock_ledger_service_1.STOCK_LEDGER_REFERENCE.INVENTORY_AUDIT,
                    referenceId: locked.id,
                    referenceFolio: locked.folio,
                    createdBy: userId,
                    notes: line.reason ?? null,
                }, qr.manager);
            }
            locked.status = inventory_audit_status_enum_1.InventoryAuditStatus.POSTED;
            locked.authorized_by = userId;
            locked.authorized_at = authorizedAt;
            if (dto.notes) {
                locked.notes = locked.notes
                    ? `${locked.notes}\n\nAutorización: ${dto.notes}`
                    : dto.notes;
            }
            await qr.manager.save(inventory_audit_entity_1.InventoryAudit, locked);
            await qr.commitTransaction();
            this.logger.log(`Auditoría ${locked.folio} autorizada por ${userId}`);
            return this.findById(locked.id, tenantId);
        }
        catch (error) {
            await qr.rollbackTransaction();
            throw error;
        }
        finally {
            await qr.release();
        }
    }
    async reject(id, dto, tenantId, userId) {
        const audit = await this.requireAudit(id, tenantId);
        this.assertStatus(audit, [inventory_audit_status_enum_1.InventoryAuditStatus.SUBMITTED], 'rechazar');
        audit.status = inventory_audit_status_enum_1.InventoryAuditStatus.DRAFT;
        audit.rejected_by = userId;
        audit.rejected_at = new Date();
        audit.rejection_reason = dto.reason.trim();
        audit.submitted_by = null;
        audit.submitted_at = null;
        await this.auditRepo.save(audit);
        return this.findById(audit.id, tenantId);
    }
    async cancel(id, dto, tenantId, userId) {
        const audit = await this.requireAudit(id, tenantId);
        this.assertStatus(audit, [inventory_audit_status_enum_1.InventoryAuditStatus.DRAFT, inventory_audit_status_enum_1.InventoryAuditStatus.SUBMITTED], 'cancelar');
        audit.status = inventory_audit_status_enum_1.InventoryAuditStatus.CANCELLED;
        audit.cancelled_by = userId;
        audit.cancelled_at = new Date();
        audit.cancellation_reason = dto.reason.trim();
        await this.auditRepo.save(audit);
        return this.findById(audit.id, tenantId);
    }
    async findAll(tenantId, filters) {
        const query = this.auditRepo
            .createQueryBuilder('audit')
            .leftJoinAndSelect('audit.warehouse', 'warehouse')
            .leftJoinAndSelect('warehouse.billing_branch', 'branch')
            .leftJoinAndSelect('branch.fiscal_configuration', 'fiscal')
            .leftJoinAndSelect('audit.product', 'product')
            .leftJoinAndSelect('audit.created_by_user', 'created_by_user')
            .leftJoinAndSelect('audit.submitted_by_user', 'submitted_by_user')
            .leftJoinAndSelect('audit.authorized_by_user', 'authorized_by_user')
            .leftJoinAndSelect('audit.rejected_by_user', 'rejected_by_user')
            .leftJoinAndSelect('audit.cancelled_by_user', 'cancelled_by_user')
            .where('audit.tenant_id = :tenantId', { tenantId });
        if (filters.search) {
            query.andWhere('(LOWER(audit.folio) LIKE LOWER(:search) OR LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.sku) LIKE LOWER(:search))', { search: `%${filters.search}%` });
        }
        if (filters.warehouse_id) {
            query.andWhere('audit.warehouse_id = :warehouseId', {
                warehouseId: filters.warehouse_id,
            });
        }
        if (filters.billing_branch_id) {
            query.andWhere('warehouse.billing_branch_id = :branchId', {
                branchId: filters.billing_branch_id,
            });
        }
        if (filters.fiscal_configuration_id) {
            query.andWhere('branch.fiscal_configuration_id = :fiscalId', {
                fiscalId: filters.fiscal_configuration_id,
            });
        }
        if (filters.product_id) {
            query.andWhere('audit.product_id = :productId', { productId: filters.product_id });
        }
        if (filters.status) {
            query.andWhere('audit.status = :status', { status: filters.status });
        }
        if (filters.created_from) {
            query.andWhere('audit.created_at >= :createdFrom', {
                createdFrom: new Date(filters.created_from),
            });
        }
        if (filters.created_to) {
            query.andWhere('audit.created_at <= :createdTo', {
                createdTo: new Date(filters.created_to),
            });
        }
        const sortBy = filters.sort_by || 'created_at';
        const allowedSort = ['created_at', 'folio', 'status'];
        const orderColumn = allowedSort.includes(sortBy) ? `audit.${sortBy}` : 'audit.created_at';
        query.orderBy(orderColumn, filters.sort_order === 'ASC' ? 'ASC' : 'DESC');
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        query.skip((page - 1) * limit).take(limit);
        const [data, total] = await query.getManyAndCount();
        const totalsByAudit = await this.loadTotalsMap(data.map((audit) => audit.id));
        return {
            data: data.map((audit) => this.mapToResponseDto(audit, [], totalsByAudit.get(audit.id))),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 0,
        };
    }
    async findById(id, tenantId) {
        const audit = await this.detailQuery()
            .where('audit.id = :id AND audit.tenant_id = :tenantId', { id, tenantId })
            .getOne();
        if (!audit) {
            throw new common_1.NotFoundException('Auditoría no encontrada');
        }
        return this.mapToResponseDto(audit, audit.lines ?? []);
    }
    detailQuery() {
        return this.auditRepo
            .createQueryBuilder('audit')
            .leftJoinAndSelect('audit.warehouse', 'warehouse')
            .leftJoinAndSelect('warehouse.billing_branch', 'branch')
            .leftJoinAndSelect('branch.fiscal_configuration', 'fiscal')
            .leftJoinAndSelect('audit.product', 'product')
            .leftJoinAndSelect('audit.created_by_user', 'created_by_user')
            .leftJoinAndSelect('audit.submitted_by_user', 'submitted_by_user')
            .leftJoinAndSelect('audit.authorized_by_user', 'authorized_by_user')
            .leftJoinAndSelect('audit.rejected_by_user', 'rejected_by_user')
            .leftJoinAndSelect('audit.cancelled_by_user', 'cancelled_by_user')
            .leftJoinAndSelect('audit.lines', 'lines')
            .leftJoinAndSelect('lines.inventory_batch', 'batch')
            .leftJoinAndSelect('batch.product', 'batch_product')
            .leftJoinAndSelect('batch.uom', 'batch_uom')
            .leftJoinAndSelect('batch.measure_uom', 'batch_measure_uom')
            .leftJoinAndSelect('lines.counted_by_user', 'counted_by_user')
            .orderBy('batch.batch_number', 'ASC');
    }
    async loadSnapshotBatches(tenantId, warehouseId, productId, includeEmpty) {
        const query = this.batchRepo
            .createQueryBuilder('batch')
            .leftJoinAndSelect('batch.product', 'product')
            .leftJoinAndSelect('batch.uom', 'uom')
            .leftJoinAndSelect('batch.measure_uom', 'measure_uom')
            .leftJoinAndSelect('batch.purchase_order_batch', 'po')
            .where('batch.tenant_id = :tenantId', { tenantId })
            .andWhere('batch.warehouse_id = :warehouseId', { warehouseId });
        if (productId) {
            query.andWhere('batch.product_id = :productId', { productId });
        }
        if (!includeEmpty) {
            query.andWhere('batch.available_quantity > 0');
        }
        return query.orderBy('product.name', 'ASC').addOrderBy('batch.created_at', 'ASC').getMany();
    }
    async findOpenAudit(tenantId, warehouseId, productId, repo = this.auditRepo) {
        const query = repo
            .createQueryBuilder('audit')
            .where('audit.tenant_id = :tenantId', { tenantId })
            .andWhere('audit.warehouse_id = :warehouseId', { warehouseId })
            .andWhere('audit.status IN (:...statuses)', { statuses: OPEN_STATUSES });
        if (productId) {
            query.andWhere('(audit.product_id IS NULL OR audit.product_id = :productId)', {
                productId,
            });
        }
        return query.getOne();
    }
    async requireWarehouse(tenantId, warehouseId) {
        const warehouse = await this.warehouseRepo.findOne({
            where: { id: warehouseId, tenant_id: tenantId },
            relations: ['billing_branch', 'billing_branch.fiscal_configuration'],
        });
        if (!warehouse) {
            throw new common_1.NotFoundException('Almacén no encontrado');
        }
        if (warehouse.status !== 'active') {
            throw new common_1.BadRequestException('El almacén no está activo');
        }
        return warehouse;
    }
    async requireAudit(id, tenantId, withLines = false) {
        const query = withLines
            ? this.auditRepo
                .createQueryBuilder('audit')
                .leftJoinAndSelect('audit.lines', 'lines')
                .where('audit.id = :id AND audit.tenant_id = :tenantId', { id, tenantId })
            : null;
        const audit = withLines
            ? await query.getOne()
            : await this.auditRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!audit) {
            throw new common_1.NotFoundException('Auditoría no encontrada');
        }
        return audit;
    }
    assertStatus(audit, allowed, action) {
        if (!allowed.includes(audit.status)) {
            throw new common_1.BadRequestException(`No se puede ${action} una auditoría en estado ${audit.status}`);
        }
    }
    async loadTotalsMap(ids) {
        const map = new Map();
        if (ids.length === 0) {
            return map;
        }
        const rows = await this.lineRepo
            .createQueryBuilder('line')
            .select('line.inventory_audit_id', 'audit_id')
            .addSelect('COUNT(line.id)', 'total_lines')
            .addSelect('SUM(CASE WHEN line.counted_quantity IS NOT NULL THEN 1 ELSE 0 END)', 'counted_lines')
            .addSelect(`SUM(CASE WHEN line.counted_quantity IS NOT NULL AND ABS(line.variance) >= ${VARIANCE_EPSILON} THEN 1 ELSE 0 END)`, 'lines_with_variance')
            .addSelect('COALESCE(SUM(line.system_quantity), 0)', 'total_system_quantity')
            .addSelect('SUM(line.counted_quantity)', 'total_counted_quantity')
            .addSelect('SUM(line.variance)', 'total_variance')
            .where('line.inventory_audit_id IN (:...ids)', { ids })
            .groupBy('line.inventory_audit_id')
            .getRawMany();
        for (const row of rows) {
            const totalLines = Number(row.total_lines) || 0;
            const countedLines = Number(row.counted_lines) || 0;
            map.set(row.audit_id, {
                total_lines: totalLines,
                counted_lines: countedLines,
                pending_lines: totalLines - countedLines,
                lines_with_variance: Number(row.lines_with_variance) || 0,
                total_system_quantity: this.formatQty(this.parseQty(row.total_system_quantity)),
                total_counted_quantity: row.total_counted_quantity === null
                    ? null
                    : this.formatQty(this.parseQty(row.total_counted_quantity)),
                total_variance: row.total_variance === null ? null : this.formatQty(this.parseQty(row.total_variance)),
            });
        }
        return map;
    }
    mapToResponseDto(audit, lines, precomputedTotals) {
        const mappedLines = lines.map((line) => this.mapLine(line));
        return {
            id: audit.id,
            folio: audit.folio,
            status: audit.status,
            warehouse: this.mapWarehouseSummary(audit.warehouse, audit.warehouse_id),
            product_id: audit.product_id,
            product_name: audit.product?.name ?? null,
            product_sku: audit.product?.sku ?? null,
            include_empty_lots: Boolean(audit.include_empty_lots),
            notes: audit.notes,
            created_by_user: this.mapUser(audit.created_by_user, audit.created_by),
            created_at: audit.created_at,
            submitted_by_user: this.mapUser(audit.submitted_by_user, audit.submitted_by),
            submitted_at: audit.submitted_at,
            authorized_by_user: this.mapUser(audit.authorized_by_user, audit.authorized_by),
            authorized_at: audit.authorized_at,
            rejected_by_user: this.mapUser(audit.rejected_by_user, audit.rejected_by),
            rejected_at: audit.rejected_at,
            rejection_reason: audit.rejection_reason,
            cancelled_by_user: this.mapUser(audit.cancelled_by_user, audit.cancelled_by),
            cancelled_at: audit.cancelled_at,
            cancellation_reason: audit.cancellation_reason,
            totals: precomputedTotals ?? this.computeTotals(mappedLines),
            lines: mappedLines,
        };
    }
    mapLine(line) {
        const batch = line.inventory_batch;
        const before = line.quantity_before_post === null || line.quantity_before_post === undefined
            ? null
            : this.parseQty(line.quantity_before_post);
        const systemQty = this.parseQty(line.system_quantity);
        const stockMoved = before !== null && Math.abs(before - systemQty) >= VARIANCE_EPSILON;
        return {
            id: line.id,
            inventory_batch_id: line.inventory_batch_id,
            batch_number: batch?.batch_number ?? '',
            source_tag_identifier: batch?.source_tag_identifier ?? null,
            ...(0, inventory_measure_util_1.mapBatchMeasure)(batch ?? {}),
            product_id: batch?.product_id ?? '',
            product_name: batch?.product?.name ?? '',
            product_sku: batch?.product?.sku ?? '',
            uom_id: batch?.uom_id ?? '',
            uom_name: batch?.uom?.name ?? '',
            system_quantity: this.formatQty(systemQty),
            counted_quantity: line.counted_quantity === null || line.counted_quantity === undefined
                ? null
                : this.formatQty(this.parseQty(line.counted_quantity)),
            variance: line.variance === null || line.variance === undefined
                ? null
                : this.formatQty(this.parseQty(line.variance)),
            reason: line.reason,
            is_additional: Boolean(line.is_additional),
            counted_by_user: this.mapUser(line.counted_by_user, line.counted_by),
            counted_at: line.counted_at,
            quantity_before_post: before === null ? null : this.formatQty(before),
            quantity_after_post: line.quantity_after_post === null || line.quantity_after_post === undefined
                ? null
                : this.formatQty(this.parseQty(line.quantity_after_post)),
            stock_moved_during_count: stockMoved,
            created_at: line.created_at,
        };
    }
    computeTotals(lines) {
        const counted = lines.filter((line) => line.counted_quantity !== null);
        const withVariance = counted.filter((line) => Math.abs(this.parseQty(line.variance)) >= VARIANCE_EPSILON);
        const totalSystem = lines.reduce((sum, line) => sum + this.parseQty(line.system_quantity), 0);
        const totalCounted = counted.reduce((sum, line) => sum + this.parseQty(line.counted_quantity), 0);
        const totalVariance = counted.reduce((sum, line) => sum + this.parseQty(line.variance), 0);
        return {
            total_lines: lines.length,
            counted_lines: counted.length,
            pending_lines: lines.length - counted.length,
            lines_with_variance: withVariance.length,
            total_system_quantity: this.formatQty(totalSystem),
            total_counted_quantity: counted.length ? this.formatQty(totalCounted) : null,
            total_variance: counted.length ? this.formatQty(totalVariance) : null,
        };
    }
    mapWarehouseSummary(warehouse, fallbackId) {
        const branch = warehouse?.billing_branch ?? null;
        const fiscal = branch?.fiscal_configuration ?? null;
        return {
            id: warehouse?.id ?? fallbackId,
            name: warehouse?.name ?? '',
            code: warehouse?.code ?? null,
            billing_branch_id: warehouse?.billing_branch_id ?? branch?.id ?? null,
            billing_branch_code: branch?.code ?? null,
            billing_branch_city: branch?.city ?? null,
            billing_branch_state: branch?.state ?? null,
            fiscal_configuration_id: fiscal?.id ?? branch?.fiscal_configuration_id ?? null,
            fiscal_razon_social: fiscal?.razon_social ?? null,
            fiscal_rfc: fiscal?.rfc ?? null,
        };
    }
    mapUser(user, fallbackId) {
        if (!fallbackId) {
            return null;
        }
        return {
            id: fallbackId,
            name: [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim(),
            email: user?.email ?? '',
        };
    }
    normalizeReason(reason) {
        const trimmed = reason?.trim();
        return trimmed ? trimmed : null;
    }
    parseQty(value) {
        const parsed = parseFloat(String(value ?? 0));
        return Number.isFinite(parsed) ? parsed : 0;
    }
    roundQty(value) {
        return parseFloat(value.toFixed(3));
    }
    formatQty(value) {
        return this.roundQty(value).toFixed(3);
    }
};
exports.InventoryAuditService = InventoryAuditService;
exports.InventoryAuditService = InventoryAuditService = InventoryAuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_audit_entity_1.InventoryAudit)),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_audit_line_entity_1.InventoryAuditLine)),
    __param(2, (0, typeorm_1.InjectRepository)(inventory_batch_entity_1.InventoryBatch)),
    __param(3, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        inventory_audit_folio_service_1.InventoryAuditFolioService,
        inventory_stock_ledger_service_1.InventoryStockLedgerService,
        typeorm_2.DataSource])
], InventoryAuditService);
//# sourceMappingURL=inventory-audit.service.js.map