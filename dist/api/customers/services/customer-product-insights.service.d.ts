import { Repository } from 'typeorm';
import { Customer } from '../../../entities/customers/customer.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import { Product } from '../../../entities/products/product.entity';
import { S3Service } from '../../../common/services/s3.service';
import { QueryCustomerProductInsightsDto } from '../dto/query-customer-product-insights.dto';
export declare class CustomerProductInsightsService {
    private readonly customerRepo;
    private readonly soRepo;
    private readonly detailRepo;
    private readonly productRepo;
    private readonly s3Service;
    constructor(customerRepo: Repository<Customer>, soRepo: Repository<SalesOrder>, detailRepo: Repository<SalesOrderDetail>, productRepo: Repository<Product>, s3Service: S3Service);
    getInsights(customerId: number, tenantId: string, query?: QueryCustomerProductInsightsDto): Promise<{
        customer_id: number;
        most_purchased: {
            product_id: string;
            name: string | null;
            sku: string | null;
            photo: string | null;
            category_id: string | null;
            category_name: string | null;
            subcategory_id: string | null;
            subcategory_name: string | null;
            times_ordered: number;
            total_quantity: number;
            total_amount: number;
            last_purchased_at: string | null;
        }[];
        recommended: {
            product_id: string;
            name: string;
            sku: string;
            photo: string | null;
            category_id: string | null;
            category_name: string | null;
            subcategory_id: string | null;
            subcategory_name: string | null;
            reason: string;
            reason_label: string;
        }[];
    }>;
    private buildRecommendations;
    private findActiveCandidates;
    private loadProductsMap;
    private signPhoto;
}
