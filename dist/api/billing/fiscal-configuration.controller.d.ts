import { FiscalConfigurationService } from './fiscal-configuration.service';
import { FiscalConfigurationFinkokService } from '../electronic-invoicing/services/fiscal-configuration-finkok.service';
import { RegisterFiscalConfigurationFinkokDto } from '../electronic-invoicing/dto/register-fiscal-configuration-finkok.dto';
import type { FinkokEnvironment } from '../../entities/electronic-invoicing/finkok-provider-configuration.entity';
import { CreateFiscalConfigurationDto } from './dto/create-fiscal-configuration.dto';
import { UpdateFiscalConfigurationDto } from './dto/update-fiscal-configuration.dto';
import { QueryFiscalConfigurationDto } from './dto/query-fiscal-configuration.dto';
import { PaginatedFiscalConfigurationDto } from './dto/paginated-fiscal-configuration.dto';
export declare class FiscalConfigurationController {
    private readonly service;
    private readonly finkokService;
    constructor(service: FiscalConfigurationService, finkokService: FiscalConfigurationFinkokService);
    create(dto: CreateFiscalConfigurationDto, req: any): Promise<import("../../entities/billing").FiscalConfiguration>;
    findAll(query: QueryFiscalConfigurationDto, req: any): Promise<PaginatedFiscalConfigurationDto>;
    getFinkokStatus(id: string, environment: FinkokEnvironment | undefined, req: {
        user: {
            tenantId: string;
        };
    }): Promise<import("../electronic-invoicing/services/fiscal-configuration-finkok.service").FinkokIssuerStatusResponse>;
    registerFinkok(id: string, dto: RegisterFiscalConfigurationFinkokDto, req: {
        user: {
            tenantId: string;
            id: string;
        };
    }): Promise<import("../electronic-invoicing/services/fiscal-configuration-finkok.service").FinkokIssuerStatusResponse>;
    findOne(id: string, req: any): Promise<import("../../entities/billing").FiscalConfiguration>;
    update(id: string, dto: UpdateFiscalConfigurationDto, req: any): Promise<import("../../entities/billing").FiscalConfiguration>;
    uploadLogo(id: string, file: Express.Multer.File, req: any): Promise<import("../../entities/billing").FiscalConfiguration>;
    remove(id: string, req: any): Promise<void>;
}
