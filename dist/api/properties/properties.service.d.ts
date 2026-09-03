import { Repository } from 'typeorm';
import { Property } from '../../entities/properties/property.entity';
import { MeasurementUnit } from '../../entities/properties/measurement-unit.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CustomerGroupsService } from '../customers/customer-groups.service';
export type PropertyListFilters = {
    group_id?: string;
    search?: string;
    status?: string;
};
export declare class PropertiesService {
    private propertyRepo;
    private measurementUnitRepo;
    private readonly customerGroupsService;
    constructor(propertyRepo: Repository<Property>, measurementUnitRepo: Repository<MeasurementUnit>, customerGroupsService: CustomerGroupsService);
    create(tenantId: string, dto: CreatePropertyDto): Promise<Property>;
    findAll(tenantId: string, filters?: PropertyListFilters, page?: number, limit?: number): Promise<any>;
    findOne(tenantId: string, id: string): Promise<Property | null>;
    findByCode(tenantId: string, code: string): Promise<Property | null>;
    update(tenantId: string, id: string, dto: UpdatePropertyDto): Promise<Property>;
    remove(tenantId: string, id: string): Promise<void>;
    getListStats(tenantId: string, filters?: PropertyListFilters): Promise<{
        currency: string | null;
        currencies: string[];
        total: {
            count: number;
            area: number;
            value: number;
        };
        available: {
            count: number;
            area: number;
            value: number;
        };
        active_in_payment: {
            count: number;
            remaining_balance: number;
        };
        reserved: {
            count: number;
        };
        sold: {
            count: number;
        };
        avg_price_per_m2: number;
    }>;
    private applyPropertyListFilters;
    private resolvePricing;
    private pricingFields;
    private presentProperty;
    getMeasurementUnits(): Promise<MeasurementUnit[]>;
    private normalizeOptionalText;
    private assertPropertyCodeAvailable;
    private rethrowIfDuplicatePropertyCode;
}
