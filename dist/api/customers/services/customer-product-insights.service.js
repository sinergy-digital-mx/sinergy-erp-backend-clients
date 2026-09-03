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
exports.CustomerProductInsightsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_entity_1 = require("../../../entities/customers/customer.entity");
const sales_order_entity_1 = require("../../../entities/sales-orders/sales-order.entity");
const sales_order_detail_entity_1 = require("../../../entities/sales-orders/sales-order-detail.entity");
const product_entity_1 = require("../../../entities/products/product.entity");
const s3_service_1 = require("../../../common/services/s3.service");
let CustomerProductInsightsService = class CustomerProductInsightsService {
    customerRepo;
    soRepo;
    detailRepo;
    productRepo;
    s3Service;
    constructor(customerRepo, soRepo, detailRepo, productRepo, s3Service) {
        this.customerRepo = customerRepo;
        this.soRepo = soRepo;
        this.detailRepo = detailRepo;
        this.productRepo = productRepo;
        this.s3Service = s3Service;
    }
    async getInsights(customerId, tenantId, query = {}) {
        const customer = await this.customerRepo.findOne({
            where: { id: customerId, tenant_id: tenantId },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Cliente no encontrado');
        }
        const mostLimit = query.most_purchased_limit ?? 8;
        const recommendedLimit = query.recommended_limit ?? 8;
        const mostRaw = await this.soRepo
            .createQueryBuilder('so')
            .innerJoin(sales_order_detail_entity_1.SalesOrderDetail, 'd', 'd.sales_order_id = so.id')
            .select('d.product_id', 'product_id')
            .addSelect('COUNT(DISTINCT so.id)', 'times_ordered')
            .addSelect('SUM(d.quantity)', 'total_quantity')
            .addSelect('SUM(d.quantity * d.unit_price)', 'total_amount')
            .addSelect('MAX(so.created_at)', 'last_purchased_at')
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere('so.customer_id = :customerId', { customerId })
            .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
            .groupBy('d.product_id')
            .orderBy('SUM(d.quantity)', 'DESC')
            .addOrderBy('COUNT(DISTINCT so.id)', 'DESC')
            .limit(mostLimit)
            .getRawMany();
        const purchasedIds = mostRaw.map((r) => r.product_id);
        const productsById = await this.loadProductsMap(purchasedIds, tenantId);
        const most_purchased = await Promise.all(mostRaw.map(async (row) => {
            const product = productsById.get(row.product_id);
            return {
                product_id: row.product_id,
                name: product?.name ?? null,
                sku: product?.sku ?? null,
                photo: await this.signPhoto(product?.photo ?? null),
                category_id: product?.category_id ?? null,
                category_name: product?.category?.name ?? null,
                subcategory_id: product?.subcategory_id ?? null,
                subcategory_name: product?.subcategory?.name ?? null,
                times_ordered: Number(row.times_ordered) || 0,
                total_quantity: parseFloat(String(row.total_quantity)) || 0,
                total_amount: parseFloat(String(row.total_amount)) || 0,
                last_purchased_at: row.last_purchased_at
                    ? new Date(row.last_purchased_at).toISOString()
                    : null,
            };
        }));
        const recommended = await this.buildRecommendations(tenantId, customerId, most_purchased, recommendedLimit);
        return {
            customer_id: customerId,
            most_purchased,
            recommended,
        };
    }
    async buildRecommendations(tenantId, customerId, mostPurchased, limit) {
        if (!mostPurchased.length) {
            return [];
        }
        const boughtRows = await this.detailRepo
            .createQueryBuilder('d')
            .innerJoin(sales_order_entity_1.SalesOrder, 'so', 'so.id = d.sales_order_id')
            .select('d.product_id', 'product_id')
            .distinct(true)
            .where('so.tenant_id = :tenantId', { tenantId })
            .andWhere('so.customer_id = :customerId', { customerId })
            .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
            .getRawMany();
        const excludeIds = new Set(boughtRows.map((r) => r.product_id));
        const subcategoryIds = [
            ...new Set(mostPurchased
                .map((p) => p.subcategory_id)
                .filter((id) => !!id)),
        ];
        const categoryIds = [
            ...new Set(mostPurchased
                .map((p) => p.category_id)
                .filter((id) => !!id)),
        ];
        if (!subcategoryIds.length && !categoryIds.length) {
            return [];
        }
        const bySub = subcategoryIds.length > 0
            ? await this.findActiveCandidates(tenantId, excludeIds, { subcategoryIds }, limit)
            : [];
        const remaining = limit - bySub.length;
        const byCat = remaining > 0 && categoryIds.length > 0
            ? await this.findActiveCandidates(tenantId, new Set([...excludeIds, ...bySub.map((p) => p.id)]), { categoryIds }, remaining)
            : [];
        const candidates = [...bySub, ...byCat];
        return Promise.all(candidates.map(async (product) => ({
            product_id: product.id,
            name: product.name,
            sku: product.sku,
            photo: await this.signPhoto(product.photo),
            category_id: product.category_id,
            category_name: product.category?.name ?? null,
            subcategory_id: product.subcategory_id,
            subcategory_name: product.subcategory?.name ?? null,
            reason: product.subcategory_id &&
                subcategoryIds.includes(product.subcategory_id)
                ? 'same_subcategory'
                : 'same_category',
            reason_label: product.subcategory_id &&
                subcategoryIds.includes(product.subcategory_id)
                ? 'Misma subcategoría'
                : 'Misma categoría',
        })));
    }
    async findActiveCandidates(tenantId, excludeIds, filter, limit) {
        if (limit <= 0)
            return [];
        const qb = this.productRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.category', 'category')
            .leftJoinAndSelect('p.subcategory', 'subcategory')
            .where('p.tenant_id = :tenantId', { tenantId })
            .andWhere('p.is_active = 1');
        if (filter.subcategoryIds?.length) {
            qb.andWhere('p.subcategory_id IN (:...subcategoryIds)', {
                subcategoryIds: filter.subcategoryIds,
            });
        }
        else if (filter.categoryIds?.length) {
            qb.andWhere('p.category_id IN (:...categoryIds)', {
                categoryIds: filter.categoryIds,
            });
        }
        else {
            return [];
        }
        if (excludeIds.size) {
            qb.andWhere('p.id NOT IN (:...excludeIds)', {
                excludeIds: [...excludeIds],
            });
        }
        return qb.orderBy('p.name', 'ASC').take(limit).getMany();
    }
    async loadProductsMap(ids, tenantId) {
        const map = new Map();
        if (!ids.length)
            return map;
        const products = await this.productRepo.find({
            where: { id: (0, typeorm_2.In)(ids), tenant_id: tenantId },
            relations: ['category', 'subcategory'],
        });
        for (const p of products) {
            map.set(p.id, p);
        }
        return map;
    }
    async signPhoto(photo) {
        if (!photo)
            return null;
        if (photo.startsWith('http://') || photo.startsWith('https://')) {
            return photo;
        }
        return this.s3Service.getSignedUrl(photo, 900).catch(() => photo);
    }
};
exports.CustomerProductInsightsService = CustomerProductInsightsService;
exports.CustomerProductInsightsService = CustomerProductInsightsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(1, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(2, (0, typeorm_1.InjectRepository)(sales_order_detail_entity_1.SalesOrderDetail)),
    __param(3, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        s3_service_1.S3Service])
], CustomerProductInsightsService);
//# sourceMappingURL=customer-product-insights.service.js.map