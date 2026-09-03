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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderLotsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_transfer_line_entity_1 = require("../../../entities/inventory/inventory-transfer-line.entity");
const user_entity_1 = require("../../../entities/users/user.entity");
const user_display_name_util_1 = require("../utils/user-display-name.util");
const purchase_order_lot_tree_util_1 = require("../utils/purchase-order-lot-tree.util");
let PurchaseOrderLotsService = class PurchaseOrderLotsService {
    transferLineRepository;
    userRepository;
    constructor(transferLineRepository, userRepository) {
        this.transferLineRepository = transferLineRepository;
        this.userRepository = userRepository;
    }
    async buildTree(batches, lineItems) {
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
                ? this.userRepository.find({ where: { id: (0, typeorm_2.In)(createdByIds) } })
                : Promise.resolve([]),
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
        return (0, purchase_order_lot_tree_util_1.buildPurchaseOrderLotTree)(list.map((batch) => {
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
                created_by_name: (0, user_display_name_util_1.formatUserDisplayName)(userById.get(batch.created_by) ?? null),
            };
        }), (lineItems ?? []).map((line) => ({
            id: line.id,
            quantity: line.quantity,
            unit_total: line.unit_total,
            received_original_unit_total: line.received_original_unit_total,
            real_unit_cost_usd: line.real_unit_cost_usd,
            real_unit_cost_mxn: line.real_unit_cost_mxn,
        })), transferLines.map((line) => ({
            id: line.inventory_transfer_id,
            folio: line.inventory_transfer?.folio ?? '',
            quantity: line.quantity,
            source_inventory_batch_id: line.source_inventory_batch_id,
            destination_inventory_batch_id: line.destination_inventory_batch_id,
            created_at: line.created_at,
            created_by_name: (0, user_display_name_util_1.formatUserDisplayName)(line.inventory_transfer?.created_by_user ?? null),
            source_warehouse_name: line.inventory_transfer?.source_warehouse?.name ?? null,
            source_sucursal: line.inventory_transfer?.source_warehouse?.billing_branch?.code ?? null,
            destination_warehouse_name: line.inventory_transfer?.destination_warehouse?.name ?? null,
            destination_sucursal: line.inventory_transfer?.destination_warehouse?.billing_branch?.code ?? null,
        })));
    }
};
exports.PurchaseOrderLotsService = PurchaseOrderLotsService;
exports.PurchaseOrderLotsService = PurchaseOrderLotsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_transfer_line_entity_1.InventoryTransferLine)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PurchaseOrderLotsService);
//# sourceMappingURL=purchase-order-lots.service.js.map