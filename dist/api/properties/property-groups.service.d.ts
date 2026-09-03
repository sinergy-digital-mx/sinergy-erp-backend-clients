import { Repository } from 'typeorm';
import { PropertyGroup } from '../../entities/properties/property-group.entity';
import { Property } from '../../entities/properties/property.entity';
import { CreatePropertyGroupDto } from './dto/create-property-group.dto';
import { UpdatePropertyGroupDto } from './dto/update-property-group.dto';
export declare class PropertyGroupsService {
    private groupRepo;
    private propertyRepo;
    constructor(groupRepo: Repository<PropertyGroup>, propertyRepo: Repository<Property>);
    create(tenantId: string, dto: CreatePropertyGroupDto): Promise<PropertyGroup>;
    findAll(tenantId: string): Promise<PropertyGroup[]>;
    findOne(tenantId: string, id: string): Promise<PropertyGroup | null>;
    update(tenantId: string, id: string, dto: UpdatePropertyGroupDto): Promise<PropertyGroup>;
    remove(tenantId: string, id: string): Promise<void>;
    getStats(tenantId: string, groupId: string): Promise<any>;
}
