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
exports.SalesOrderExportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sales_order_entity_1 = require("../../../entities/sales-orders/sales-order.entity");
const sales_order_detail_entity_1 = require("../../../entities/sales-orders/sales-order-detail.entity");
const sales_order_payment_entity_1 = require("../../../entities/sales-orders/sales-order-payment.entity");
const pos_sale_collection_entity_1 = require("../../../entities/pos/pos-sale-collection.entity");
const excel_export_util_1 = require("../../../common/utils/excel-export.util");
const sales_order_collection_channel_util_1 = require("../utils/sales-order-collection-channel.util");
let SalesOrderExportService = class SalesOrderExportService {
    soRepo;
    detailRepo;
    paymentRepo;
    posCollectionRepo;
    headerColumns = [
        { header: 'Folio', key: 'folio', width: 14 },
        { header: 'Fecha creación', key: 'created_at', width: 18, type: 'date' },
        { header: 'Tipo', key: 'sales_order_type', width: 10 },
        { header: 'Estado', key: 'general_status', width: 12 },
        { header: 'Pago', key: 'payment_status', width: 12 },
        { header: 'Origen cobro', key: 'collection_channel_label', width: 22 },
        { header: 'Crédito', key: 'is_credit', width: 12 },
        { header: 'Cliente', key: 'customer_name', width: 28 },
        { header: 'Razón social', key: 'razon_social', width: 28 },
        { header: 'Sucursal', key: 'billing_branch_code', width: 24 },
        { header: 'Entrega esperada', key: 'expected_delivery_date', width: 14, type: 'date' },
        { header: 'Subtotal', key: 'subtotal', width: 14, type: 'currency' },
        { header: 'Descuento', key: 'discount_total', width: 12, type: 'currency' },
        { header: 'IVA', key: 'iva_total', width: 12, type: 'currency' },
        { header: 'IEPS', key: 'ieps_total', width: 12, type: 'currency' },
        { header: 'Total', key: 'total', width: 14, type: 'currency' },
        { header: 'Vendedor', key: 'seller_name', width: 22 },
        { header: 'Comisionado', key: 'assigned_seller_name', width: 24 },
        { header: 'Notas', key: 'notes', width: 30 },
    ];
    detailColumns = [
        { header: 'Folio orden', key: 'folio', width: 14 },
        { header: 'Fecha orden', key: 'order_created_at', width: 18, type: 'date' },
        { header: 'Estado orden', key: 'general_status', width: 12 },
        { header: 'Pago', key: 'payment_status', width: 12 },
        { header: 'Origen cobro', key: 'collection_channel_label', width: 22 },
        { header: 'Crédito', key: 'is_credit', width: 12 },
        { header: 'Cliente', key: 'customer_name', width: 24 },
        { header: 'Razón social', key: 'razon_social', width: 26 },
        { header: 'Sucursal', key: 'billing_branch_code', width: 22 },
        { header: 'SKU', key: 'product_sku', width: 14 },
        { header: 'Producto', key: 'product_name', width: 28 },
        { header: 'UOM', key: 'uom_name', width: 12 },
        { header: 'Cantidad', key: 'quantity', width: 12, type: 'number' },
        { header: 'Precio unit.', key: 'unit_price', width: 14, type: 'currency' },
        { header: 'Desc. %', key: 'discount_percentage', width: 10, type: 'percent' },
        { header: 'Desc. unit.', key: 'discount_unit', width: 12, type: 'currency' },
        { header: 'Descuento', key: 'discount_name', width: 20 },
        { header: 'IVA %', key: 'iva_percentage', width: 10, type: 'percent' },
        { header: 'Subtotal línea', key: 'line_subtotal', width: 14, type: 'currency' },
        { header: 'Total línea', key: 'line_total', width: 14, type: 'currency' },
    ];
    constructor(soRepo, detailRepo, paymentRepo, posCollectionRepo) {
        this.soRepo = soRepo;
        this.detailRepo = detailRepo;
        this.paymentRepo = paymentRepo;
        this.posCollectionRepo = posCollectionRepo;
    }
    async exportHeaders(tenantId, filters) {
        const orders = await this.fetchOrders(tenantId, filters);
        const channelByOrder = await this.loadCollectionChannels(tenantId, orders);
        const rows = orders.map((so) => ({
            folio: so.folio,
            created_at: (0, excel_export_util_1.formatExportDateTime)(so.created_at),
            sales_order_type: so.sales_order_type,
            general_status: so.general_status,
            payment_status: so.payment_status,
            collection_channel_label: channelByOrder.get(so.id)?.collection_channel_label ?? '',
            is_credit: so.is_credit ? 'Sí' : 'No',
            customer_name: this.formatCustomerName(so),
            razon_social: so.fiscal_configuration?.razon_social ?? so.fiscal_razon_social ?? '',
            billing_branch_code: so.billing_branch?.code ?? so.warehouse?.billing_branch?.code ?? '',
            expected_delivery_date: (0, excel_export_util_1.formatExportDate)(so.expected_delivery_date),
            subtotal: (0, excel_export_util_1.num)(so.subtotal),
            discount_total: (0, excel_export_util_1.num)(so.discount_total),
            iva_total: (0, excel_export_util_1.num)(so.iva_total),
            ieps_total: (0, excel_export_util_1.num)(so.ieps_total),
            total: (0, excel_export_util_1.num)(so.total),
            seller_name: this.formatUserName(so.seller_user),
            assigned_seller_name: this.formatUserName(so.assigned_seller_user),
            notes: so.notes ?? '',
        }));
        return (0, excel_export_util_1.buildStyledExcelBuffer)({
            sheetName: 'Cabeceras',
            title: 'Reporte de órdenes de venta — Cabeceras',
            subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                `Generado: ${(0, excel_export_util_1.formatExportDateTime)(new Date())}`,
                `Registros: ${rows.length}`,
                this.describeFilters(filters),
            ]),
            columns: this.headerColumns,
            rows,
            headerColor: 'FF1B7F5E',
            titleColor: 'FF145A47',
        });
    }
    async exportDetails(tenantId, filters) {
        try {
            (0, excel_export_util_1.validateDateRange)(filters.created_from, filters.created_to);
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
        const detailsQb = this.detailRepo
            .createQueryBuilder('d')
            .innerJoinAndSelect('d.sales_order', 'so')
            .leftJoinAndSelect('so.customer', 'customer')
            .leftJoinAndSelect('so.fiscal_configuration', 'fiscal_configuration')
            .leftJoinAndSelect('so.billing_branch', 'billing_branch')
            .leftJoinAndSelect('so.warehouse', 'warehouse')
            .leftJoinAndSelect('d.product', 'product')
            .leftJoinAndSelect('d.product_uom', 'product_uom')
            .leftJoinAndSelect('product_uom.uom', 'uom')
            .leftJoinAndSelect('d.product_discount', 'product_discount')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere('so.created_at >= :from', { from: new Date(filters.created_from) })
            .andWhere('so.created_at <= :to', {
            to: this.endOfDay(new Date(filters.created_to)),
        });
        (0, sales_order_collection_channel_util_1.applySalesOrderCollectionChannelFilter)(detailsQb, 'so', filters.collection_channel);
        const details = await detailsQb
            .orderBy('so.created_at', 'DESC')
            .addOrderBy('so.folio', 'ASC')
            .addOrderBy('d.created_at', 'ASC')
            .getMany();
        const filtered = this.applyDetailFilters(details, filters);
        const channelByOrder = await this.loadCollectionChannels(tenantId, filtered
            .map((d) => d.sales_order)
            .filter((so) => !!so));
        const rows = filtered.map((d) => {
            const qty = (0, excel_export_util_1.num)(d.quantity);
            const unitPrice = (0, excel_export_util_1.num)(d.unit_price);
            const discountUnit = (0, excel_export_util_1.num)(d.discount_unit);
            const lineSubtotal = qty * unitPrice;
            const lineTotal = lineSubtotal - discountUnit * qty;
            return {
                folio: d.sales_order?.folio ?? '',
                order_created_at: (0, excel_export_util_1.formatExportDateTime)(d.sales_order?.created_at),
                general_status: d.sales_order?.general_status ?? '',
                payment_status: d.sales_order?.payment_status ?? '',
                collection_channel_label: d.sales_order
                    ? (channelByOrder.get(d.sales_order.id)?.collection_channel_label ?? '')
                    : '',
                is_credit: d.sales_order?.is_credit ? 'Sí' : 'No',
                customer_name: d.sales_order ? this.formatCustomerName(d.sales_order) : '',
                razon_social: d.sales_order?.fiscal_configuration?.razon_social ??
                    d.sales_order?.fiscal_razon_social ??
                    '',
                billing_branch_code: d.sales_order?.billing_branch?.code ??
                    d.sales_order?.warehouse?.billing_branch?.code ??
                    '',
                product_sku: d.product?.sku ?? '',
                product_name: d.product?.name ?? '',
                uom_name: d.product_uom?.uom?.name ?? '',
                quantity: qty,
                unit_price: unitPrice,
                discount_percentage: (0, excel_export_util_1.num)(d.discount_percentage),
                discount_unit: discountUnit,
                discount_name: d.product_discount?.name ?? '',
                iva_percentage: (0, excel_export_util_1.num)(d.iva_percentage),
                line_subtotal: lineSubtotal,
                line_total: lineTotal,
            };
        });
        return (0, excel_export_util_1.buildStyledExcelBuffer)({
            sheetName: 'Detalle',
            title: 'Reporte de órdenes de venta — Detalle de líneas',
            subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                `Periodo: ${(0, excel_export_util_1.formatExportDate)(filters.created_from)} — ${(0, excel_export_util_1.formatExportDate)(filters.created_to)}`,
                `Generado: ${(0, excel_export_util_1.formatExportDateTime)(new Date())}`,
                `Líneas: ${rows.length}`,
                this.describeFilters(filters),
            ]),
            columns: this.detailColumns,
            rows,
            headerColor: 'FF2E8B57',
            titleColor: 'FF1F6049',
        });
    }
    getHeadersFilename() {
        return `ventas-cabeceras-${this.todaySuffix()}.xlsx`;
    }
    getDetailsFilename(from, to) {
        return `ventas-detalle-${from}_${to}.xlsx`;
    }
    async fetchOrders(tenantId, filters) {
        const qb = this.soRepo
            .createQueryBuilder('so')
            .leftJoinAndSelect('so.customer', 'customer')
            .leftJoinAndSelect('so.fiscal_configuration', 'fiscal_configuration')
            .leftJoinAndSelect('so.billing_branch', 'billing_branch')
            .leftJoinAndSelect('so.warehouse', 'warehouse')
            .leftJoinAndSelect('so.seller_user', 'seller_user')
            .leftJoinAndSelect('so.assigned_seller_user', 'assigned_seller_user')
            .where('so.tenant_id = :tenantId', { tenantId });
        this.applyOrderFilters(qb, filters);
        if (filters.created_from) {
            qb.andWhere('so.created_at >= :from', { from: new Date(filters.created_from) });
        }
        if (filters.created_to) {
            qb.andWhere('so.created_at <= :to', {
                to: this.endOfDay(new Date(filters.created_to)),
            });
        }
        qb.orderBy('so.created_at', 'DESC');
        return qb.getMany();
    }
    applyOrderFilters(qb, filters) {
        if (filters.search) {
            qb.andWhere('(so.folio LIKE :s OR customer.name LIKE :s OR customer.lastname LIKE :s OR customer.company_name LIKE :s)', { s: `%${filters.search}%` });
        }
        if (filters.general_status) {
            const statuses = Array.isArray(filters.general_status)
                ? filters.general_status
                : [filters.general_status];
            if (statuses.length === 1) {
                qb.andWhere('so.general_status = :general_status', {
                    general_status: statuses[0],
                });
            }
            else if (statuses.length > 1) {
                qb.andWhere('so.general_status IN (:...general_statuses)', {
                    general_statuses: statuses,
                });
            }
        }
        if (filters.payment_status) {
            qb.andWhere('so.payment_status = :payment_status', { payment_status: filters.payment_status });
        }
        if (typeof filters.is_credit === 'boolean') {
            qb.andWhere('so.is_credit = :is_credit', { is_credit: filters.is_credit });
        }
        if (filters.sales_order_type) {
            qb.andWhere('so.sales_order_type = :sales_order_type', {
                sales_order_type: filters.sales_order_type,
            });
        }
        (0, sales_order_collection_channel_util_1.applySalesOrderCollectionChannelFilter)(qb, 'so', filters.collection_channel);
        if (filters.fiscal_configuration_id) {
            qb.andWhere('so.fiscal_configuration_id = :fiscal_configuration_id', {
                fiscal_configuration_id: filters.fiscal_configuration_id,
            });
        }
        if (filters.billing_branch_id) {
            qb.andWhere('(so.billing_branch_id = :billing_branch_id OR (so.billing_branch_id IS NULL AND warehouse.billing_branch_id = :billing_branch_id))', { billing_branch_id: filters.billing_branch_id });
        }
        if (filters.customer_id) {
            qb.andWhere('so.customer_id = :customer_id', { customer_id: filters.customer_id });
        }
    }
    applyDetailFilters(details, filters) {
        return details.filter((d) => {
            const so = d.sales_order;
            if (!so)
                return false;
            if (filters.general_status) {
                const statuses = Array.isArray(filters.general_status)
                    ? filters.general_status
                    : [filters.general_status];
                if (!statuses.includes(so.general_status))
                    return false;
            }
            if (filters.payment_status && so.payment_status !== filters.payment_status)
                return false;
            if (typeof filters.is_credit === 'boolean' && Boolean(so.is_credit) !== filters.is_credit) {
                return false;
            }
            if (filters.sales_order_type && so.sales_order_type !== filters.sales_order_type)
                return false;
            if (filters.fiscal_configuration_id &&
                so.fiscal_configuration_id !== filters.fiscal_configuration_id) {
                return false;
            }
            if (filters.billing_branch_id &&
                so.billing_branch_id !== filters.billing_branch_id &&
                so.warehouse?.billing_branch_id !== filters.billing_branch_id) {
                return false;
            }
            if (filters.customer_id && so.customer_id !== filters.customer_id)
                return false;
            if (filters.search) {
                const s = filters.search.toLowerCase();
                const haystack = [
                    so.folio,
                    so.customer?.name,
                    so.customer?.lastname,
                    so.customer?.company_name,
                    d.product?.sku,
                    d.product?.name,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (!haystack.includes(s))
                    return false;
            }
            return true;
        });
    }
    async loadCollectionChannels(tenantId, orders) {
        const unique = new Map();
        for (const order of orders) {
            unique.set(order.id, order);
        }
        const uniqueOrders = [...unique.values()];
        if (uniqueOrders.length === 0) {
            return new Map();
        }
        const orderIds = uniqueOrders.map((order) => order.id);
        const [collections, payments] = await Promise.all([
            this.posCollectionRepo.find({
                where: { tenant_id: tenantId, sales_order_id: (0, typeorm_2.In)(orderIds) },
                select: ['id', 'sales_order_id'],
            }),
            this.paymentRepo.find({
                where: { tenant_id: tenantId, sales_order_id: (0, typeorm_2.In)(orderIds) },
                select: ['id', 'sales_order_id', 'source'],
            }),
        ]);
        return (0, sales_order_collection_channel_util_1.mapCollectionChannelByOrderId)(uniqueOrders, collections, payments);
    }
    formatCustomerName(so) {
        const c = so.customer;
        if (!c)
            return '';
        if (c.company_name)
            return c.company_name;
        return [c.name, c.lastname].filter(Boolean).join(' ').trim();
    }
    formatUserName(user) {
        if (!user)
            return '';
        return [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    }
    describeFilters(filters) {
        const parts = [];
        if (filters.created_from || filters.created_to) {
            parts.push(`Fechas: ${filters.created_from ? (0, excel_export_util_1.formatExportDate)(filters.created_from) : '…'} — ${filters.created_to ? (0, excel_export_util_1.formatExportDate)(filters.created_to) : '…'}`);
        }
        if (filters.general_status)
            parts.push(`Estado: ${filters.general_status}`);
        if (filters.payment_status)
            parts.push(`Pago: ${filters.payment_status}`);
        if (typeof filters.is_credit === 'boolean') {
            parts.push(`Crédito: ${filters.is_credit ? 'Sí' : 'No'}`);
        }
        if (filters.sales_order_type)
            parts.push(`Tipo: ${filters.sales_order_type}`);
        if (filters.collection_channel) {
            parts.push(`Origen cobro: ${sales_order_collection_channel_util_1.SALES_ORDER_COLLECTION_CHANNEL_LABELS[filters.collection_channel]}`);
        }
        if (filters.fiscal_configuration_id)
            parts.push('Razón social filtrada');
        if (filters.billing_branch_id)
            parts.push('Sucursal filtrada');
        if (filters.search)
            parts.push(`Búsqueda: ${filters.search}`);
        return parts.join(' | ');
    }
    endOfDay(date) {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    }
    todaySuffix() {
        return new Date().toISOString().slice(0, 10);
    }
};
exports.SalesOrderExportService = SalesOrderExportService;
exports.SalesOrderExportService = SalesOrderExportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(sales_order_detail_entity_1.SalesOrderDetail)),
    __param(2, (0, typeorm_1.InjectRepository)(sales_order_payment_entity_1.SalesOrderPayment)),
    __param(3, (0, typeorm_1.InjectRepository)(pos_sale_collection_entity_1.PosSaleCollection)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SalesOrderExportService);
//# sourceMappingURL=sales-order-export.service.js.map