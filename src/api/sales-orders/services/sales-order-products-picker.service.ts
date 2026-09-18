import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryService } from '../../inventory/inventory.service';
import { ProductService } from '../../products/product.service';
import { ProductItemKind } from '../../../entities/products/product-item-kind.enum';
import { SalesOrderSaleScope } from '../../../entities/sales-orders/sales-order-sale-scope.enum';
import { QuerySalesOrderProductsSummaryDto } from '../dto/query-sales-order-products-summary.dto';
import { PosSessionInventorySummaryResponseDto } from '../../inventory/dto/pos-session-inventory-summary-response.dto';

@Injectable()
export class SalesOrderProductsPickerService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly productService: ProductService,
  ) {}

  async getSummary(
    tenantId: string,
    query: QuerySalesOrderProductsSummaryDto,
  ): Promise<PosSessionInventorySummaryResponseDto> {
    const saleScope = query.sale_scope ?? SalesOrderSaleScope.Inventory;

    if (saleScope === SalesOrderSaleScope.Services) {
      return this.productService.findServiceCatalogSummary(tenantId, query) as Promise<
        PosSessionInventorySummaryResponseDto
      >;
    }

    if (saleScope === SalesOrderSaleScope.Inventory) {
      const goods = await this.inventoryService.getBranchInventorySummary(
        tenantId,
        query.billing_branch_id,
        {
          fiscal_configuration_id: query.fiscal_configuration_id,
          search: query.search,
          only_available: true,
          page: query.page ?? 1,
          limit: query.limit ?? 40,
        },
      );
      return this.tagGoods(goods);
    }

    return this.getCombinedSummary(tenantId, query);
  }

  private async getCombinedSummary(
    tenantId: string,
    query: QuerySalesOrderProductsSummaryDto,
  ): Promise<PosSessionInventorySummaryResponseDto> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = Math.min(query.limit && query.limit > 0 ? query.limit : 40, 100);
    const fetchLimit = Math.min(page * limit, 100);

    const [services, goods] = await Promise.all([
      this.productService.findServiceCatalogSummary(tenantId, {
        ...query,
        page: 1,
        limit: fetchLimit,
      }),
      this.inventoryService
        .getBranchInventorySummary(
          tenantId,
          query.billing_branch_id,
          {
            fiscal_configuration_id: query.fiscal_configuration_id,
            search: query.search,
            only_available: true,
            page: 1,
            limit: fetchLimit,
          },
        )
        .then((summary) => this.tagGoods(summary))
        .catch((error) => {
          if (error instanceof NotFoundException) {
            return {
              billing_branch_id: query.billing_branch_id,
              fiscal_configuration_id: query.fiscal_configuration_id,
              warehouses: [],
              applied_warehouse_id: null,
              data: [],
              total: 0,
              page: 1,
              limit: fetchLimit,
              totalPages: 0,
            } as PosSessionInventorySummaryResponseDto;
          }
          throw error;
        }),
    ]);

    const seen = new Set<string>();
    const merged = [...services.data, ...goods.data].filter((row) => {
      if (seen.has(row.product_id)) {
        return false;
      }
      seen.add(row.product_id);
      return true;
    });

    const start = (page - 1) * limit;
    const data = merged.slice(start, start + limit);
    const total = merged.length;

    return {
      billing_branch_id: query.billing_branch_id,
      fiscal_configuration_id: query.fiscal_configuration_id,
      warehouses: goods.warehouses ?? [],
      applied_warehouse_id: goods.applied_warehouse_id ?? null,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  private tagGoods(
    summary: PosSessionInventorySummaryResponseDto,
  ): PosSessionInventorySummaryResponseDto {
    return {
      ...summary,
      data: (summary.data ?? []).map((row) => ({
        ...row,
        item_kind: row.item_kind ?? ProductItemKind.Goods,
      })),
    };
  }
}
