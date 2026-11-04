import { Repository } from 'typeorm';
import { CustomerPriceList } from '../../../entities/customers/customer-price-list.entity';
import { Customer } from '../../../entities/customers/customer.entity';
import { PriceList } from '../../../entities/products/price-list.entity';
import { CustomerPriceListAssignmentDto } from '../dto/upsert-customer-price-lists.dto';
export interface CustomerPriceListView {
    id: string;
    price_list_id: string;
    name: string;
    is_default: boolean;
    is_active: boolean;
}
export declare class CustomerPriceListService {
    private readonly assignmentRepo;
    private readonly customerRepo;
    private readonly priceListRepo;
    constructor(assignmentRepo: Repository<CustomerPriceList>, customerRepo: Repository<Customer>, priceListRepo: Repository<PriceList>);
    list(customerId: number, tenantId: string): Promise<{
        price_lists: CustomerPriceListView[];
    }>;
    replace(customerId: number, tenantId: string, items: CustomerPriceListAssignmentDto[]): Promise<{
        price_lists: CustomerPriceListView[];
    }>;
    private requireCustomer;
    private loadViews;
}
