import { DataSource, Repository } from 'typeorm';
import { Property } from '../../entities/properties/property.entity';
import { MeasurementUnit } from '../../entities/properties/measurement-unit.entity';
import { CustomerGroupsService } from '../customers/customer-groups.service';
export declare class PropertyImportService {
    private readonly propertyRepo;
    private readonly measurementUnitRepo;
    private readonly customerGroupsService;
    private readonly dataSource;
    constructor(propertyRepo: Repository<Property>, measurementUnitRepo: Repository<MeasurementUnit>, customerGroupsService: CustomerGroupsService, dataSource: DataSource);
    exportTemplate(organizationId: string): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    importWorkbook(organizationId: string, file?: Express.Multer.File): Promise<{
        created: number;
    }>;
    private findExistingCodes;
}
