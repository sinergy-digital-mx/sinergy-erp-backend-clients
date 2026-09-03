import { TenantContextService } from '../rbac/services/tenant-context.service';
import { PropertyGroupsService } from './property-groups.service';
import { CreatePropertyGroupDto } from './dto/create-property-group.dto';
import { UpdatePropertyGroupDto } from './dto/update-property-group.dto';
export declare class PropertyGroupsController {
    private propertyGroupsService;
    private tenantContext;
    constructor(propertyGroupsService: PropertyGroupsService, tenantContext: TenantContextService);
    create(dto: CreatePropertyGroupDto): Promise<import("../../entities/properties/property-group.entity").PropertyGroup>;
    findAll(): Promise<import("../../entities/properties/property-group.entity").PropertyGroup[]>;
    findOne(id: string): Promise<import("../../entities/properties/property-group.entity").PropertyGroup | null>;
    update(id: string, dto: UpdatePropertyGroupDto): Promise<import("../../entities/properties/property-group.entity").PropertyGroup>;
    remove(id: string): Promise<void>;
    getStats(id: string): Promise<any>;
}
