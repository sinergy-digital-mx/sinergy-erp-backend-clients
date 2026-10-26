import { RequiredPermission } from '../rbac/decorators/require-permissions.decorator';
import { PermissionService } from '../rbac/services/permission.service';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { PropertiesService } from './properties.service';
import { PropertyImportService } from './property-import.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';
export declare const PROPERTY_LIST_PERMISSIONS: RequiredPermission[];
export declare class PropertiesController {
    private propertiesService;
    private propertyImportService;
    private tenantContext;
    private permissionService;
    constructor(propertiesService: PropertiesService, propertyImportService: PropertyImportService, tenantContext: TenantContextService, permissionService: PermissionService);
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
    downloadImportTemplate(res: any): Promise<void>;
    importProperties(file: Express.Multer.File, groupId?: string): Promise<{
        created: number;
    }>;
    findAll(req: any, query: QueryPropertiesDto): Promise<any>;
    findOne(id: string, req: any): Promise<import("../../entities/properties/property.entity").Property | null>;
    update(id: string, dto: UpdatePropertyDto, req: any): Promise<import("../../entities/properties/property.entity").Property>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    private requireOrganizationId;
    private toPropertyFilters;
}
