import { Repository } from 'typeorm';
import { PosConfiguration } from '../../entities/billing/pos-configuration.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { CreatePosConfigurationDto } from './dto/create-pos-configuration.dto';
import { UpdatePosConfigurationDto } from './dto/update-pos-configuration.dto';
import { QueryPosConfigurationDto } from './dto/query-pos-configuration.dto';
import { PaginatedPosConfigurationDto } from './dto/paginated-pos-configuration.dto';
export declare class PosConfigurationService {
    private repo;
    private branchRepo;
    constructor(repo: Repository<PosConfiguration>, branchRepo: Repository<BillingBranch>);
    create(dto: CreatePosConfigurationDto, tenantId: string): Promise<PosConfiguration>;
    findAll(tenantId: string, query?: QueryPosConfigurationDto): Promise<PaginatedPosConfigurationDto>;
    findOne(id: string, tenantId: string): Promise<PosConfiguration>;
    update(id: string, dto: UpdatePosConfigurationDto, tenantId: string): Promise<PosConfiguration>;
    remove(id: string, tenantId: string): Promise<void>;
    private validateBranch;
}
