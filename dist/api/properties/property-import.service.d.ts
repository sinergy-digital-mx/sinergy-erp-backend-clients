import { DataSource, Repository } from 'typeorm';
import { Property } from '../../entities/properties/property.entity';
import { MeasurementUnit } from '../../entities/properties/measurement-unit.entity';
import { CustomerGroupsService } from '../customers/customer-groups.service';
import { PropertyImportJob } from './property-import-job.store';
export declare class PropertyImportService {
    private readonly propertyRepo;
    private readonly measurementUnitRepo;
    private readonly customerGroupsService;
    private readonly dataSource;
    private readonly logger;
    constructor(propertyRepo: Repository<Property>, measurementUnitRepo: Repository<MeasurementUnit>, customerGroupsService: CustomerGroupsService, dataSource: DataSource);
    exportTemplate(organizationId: string): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    startImportJob(organizationId: string, file?: Express.Multer.File): Promise<PropertyImportJob>;
    getJobStatus(jobId: string, organizationId: string): PropertyImportJob;
    importWorkbook(organizationId: string, file?: Express.Multer.File): Promise<{
        created: number;
    }>;
    private resolveReadyRows;
    private runImportJob;
    private persistRows;
    private toErrorMessage;
    private findExistingCodes;
}
