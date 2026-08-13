import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Customer } from '../../../entities/customers/customer.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import { Product } from '../../../entities/products/product.entity';
import { S3Service } from '../../../common/services/s3.service';
import { QueryCustomerProductInsightsDto } from '../dto/query-customer-product-insights.dto';

type MostPurchasedRaw = {
  product_id: string;
  times_ordered: string;
  total_quantity: string;
  total_amount: string;
  last_purchased_at: Date | string;
};

@Injectable()
export class CustomerProductInsightsService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(SalesOrder)
    private readonly soRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderDetail)
    private readonly detailRepo: Repository<SalesOrderDetail>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Productos más comprados por el cliente + sugerencias por misma categoría/subcategoría.
   */
  async getInsights(
    customerId: number,
    tenantId: string,
    query: QueryCustomerProductInsightsDto = {},
  ) {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, tenant_id: tenantId },
    });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const mostLimit = query.most_purchased_limit ?? 8;
    const recommendedLimit = query.recommended_limit ?? 8;

    const mostRaw = await this.soRepo
      .createQueryBuilder('so')
      .innerJoin(SalesOrderDetail, 'd', 'd.sales_order_id = so.id')
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
      .getRawMany<MostPurchasedRaw>();

    const purchasedIds = mostRaw.map((r) => r.product_id);
    const productsById = await this.loadProductsMap(purchasedIds, tenantId);

    const most_purchased = await Promise.all(
      mostRaw.map(async (row) => {
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
      }),
    );

    const recommended = await this.buildRecommendations(
      tenantId,
      customerId,
      most_purchased,
      recommendedLimit,
    );

    return {
      customer_id: customerId,
      most_purchased,
      recommended,
    };
  }

  private async buildRecommendations(
    tenantId: string,
    customerId: number,
    mostPurchased: Array<{
      product_id: string;
      category_id: string | null;
      subcategory_id: string | null;
    }>,
    limit: number,
  ) {
    if (!mostPurchased.length) {
      return [];
    }

    const boughtRows = await this.detailRepo
      .createQueryBuilder('d')
      .innerJoin(SalesOrder, 'so', 'so.id = d.sales_order_id')
      .select('d.product_id', 'product_id')
      .distinct(true)
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.customer_id = :customerId', { customerId })
      .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
      .getRawMany<{ product_id: string }>();

    const excludeIds = new Set(boughtRows.map((r) => r.product_id));

    const subcategoryIds = [
      ...new Set(
        mostPurchased
          .map((p) => p.subcategory_id)
          .filter((id): id is string => !!id),
      ),
    ];
    const categoryIds = [
      ...new Set(
        mostPurchased
          .map((p) => p.category_id)
          .filter((id): id is string => !!id),
      ),
    ];

    if (!subcategoryIds.length && !categoryIds.length) {
      return [];
    }

    // Prioridad: misma subcategoría, luego misma categoría
    const bySub =
      subcategoryIds.length > 0
        ? await this.findActiveCandidates(
            tenantId,
            excludeIds,
            { subcategoryIds },
            limit,
          )
        : [];

    const remaining = limit - bySub.length;
    const byCat =
      remaining > 0 && categoryIds.length > 0
        ? await this.findActiveCandidates(
            tenantId,
            new Set([...excludeIds, ...bySub.map((p) => p.id)]),
            { categoryIds },
            remaining,
          )
        : [];

    const candidates = [...bySub, ...byCat];

    return Promise.all(
      candidates.map(async (product) => ({
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        photo: await this.signPhoto(product.photo),
        category_id: product.category_id,
        category_name: product.category?.name ?? null,
        subcategory_id: product.subcategory_id,
        subcategory_name: product.subcategory?.name ?? null,
        reason:
          product.subcategory_id &&
          subcategoryIds.includes(product.subcategory_id)
            ? 'same_subcategory'
            : 'same_category',
        reason_label:
          product.subcategory_id &&
          subcategoryIds.includes(product.subcategory_id)
            ? 'Misma subcategoría'
            : 'Misma categoría',
      })),
    );
  }

  private async findActiveCandidates(
    tenantId: string,
    excludeIds: Set<string>,
    filter: { subcategoryIds?: string[]; categoryIds?: string[] },
    limit: number,
  ): Promise<Product[]> {
    if (limit <= 0) return [];

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
    } else if (filter.categoryIds?.length) {
      qb.andWhere('p.category_id IN (:...categoryIds)', {
        categoryIds: filter.categoryIds,
      });
    } else {
      return [];
    }

    if (excludeIds.size) {
      qb.andWhere('p.id NOT IN (:...excludeIds)', {
        excludeIds: [...excludeIds],
      });
    }

    return qb.orderBy('p.name', 'ASC').take(limit).getMany();
  }

  private async loadProductsMap(
    ids: string[],
    tenantId: string,
  ): Promise<Map<string, Product>> {
    const map = new Map<string, Product>();
    if (!ids.length) return map;

    const products = await this.productRepo.find({
      where: { id: In(ids), tenant_id: tenantId },
      relations: ['category', 'subcategory'],
    });
    for (const p of products) {
      map.set(p.id, p);
    }
    return map;
  }

  private async signPhoto(photo: string | null): Promise<string | null> {
    if (!photo) return null;
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    return this.s3Service.getSignedUrl(photo, 900).catch(() => photo);
  }
}
