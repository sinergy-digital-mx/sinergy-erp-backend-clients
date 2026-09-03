import { Repository } from 'typeorm';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { CreateFiscalConfigurationDto } from './dto/create-fiscal-configuration.dto';
import { UpdateFiscalConfigurationDto } from './dto/update-fiscal-configuration.dto';
import { QueryFiscalConfigurationDto } from './dto/query-fiscal-configuration.dto';
import { PaginatedFiscalConfigurationDto } from './dto/paginated-fiscal-configuration.dto';
import { S3Service } from '../../common/services/s3.service';
export declare class FiscalConfigurationService {
    private repo;
    private readonly s3Service;
    constructor(repo: Repository<FiscalConfiguration>, s3Service: S3Service);
    create(dto: CreateFiscalConfigurationDto, tenantId: string, userId?: string): Promise<FiscalConfiguration>;
    findAll(tenantId: string, query?: QueryFiscalConfigurationDto): Promise<PaginatedFiscalConfigurationDto>;
    findOne(id: string, tenantId: string): Promise<FiscalConfiguration>;
    update(id: string, dto: UpdateFiscalConfigurationDto, tenantId: string): Promise<FiscalConfiguration>;
    remove(id: string, tenantId: string): Promise<void>;
    uploadLogo(id: string, tenantId: string, file: Express.Multer.File): Promise<FiscalConfiguration>;
    private getByIdOrFail;
    private persistPrefix;
    private attachPrefixes;
    private toResponseWithLogoUrl;
}
