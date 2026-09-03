import { TenantContextService } from '../rbac/services/tenant-context.service';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';
export declare class PropertiesController {
    private propertiesService;
    private tenantContext;
    constructor(propertiesService: PropertiesService, tenantContext: TenantContextService);
    create(req: any, dto: CreatePropertyDto): Promise<import("../../entities/properties/property.entity").Property>;
    getMeasurementUnits(): Promise<import("../../entities/properties/measurement-unit.entity").MeasurementUnit[]>;
    findByCode(code: string, req: any): Promise<import("../../entities/properties/property.entity").Property | null>;
    getListStats(req: any, query: QueryPropertiesDto): Promise<{
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
    findAll(req: any, query: QueryPropertiesDto): Promise<any>;
    findOne(id: string, req: any): Promise<import("../../entities/properties/property.entity").Property | null>;
    update(id: string, dto: UpdatePropertyDto, req: any): Promise<import("../../entities/properties/property.entity").Property>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    private toPropertyFilters;
}
