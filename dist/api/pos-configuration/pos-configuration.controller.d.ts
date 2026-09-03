import { PosConfigurationService } from './pos-configuration.service';
import { CreatePosConfigurationDto } from './dto/create-pos-configuration.dto';
import { UpdatePosConfigurationDto } from './dto/update-pos-configuration.dto';
import { QueryPosConfigurationDto } from './dto/query-pos-configuration.dto';
import { PaginatedPosConfigurationDto } from './dto/paginated-pos-configuration.dto';
export declare class PosConfigurationController {
    private readonly service;
    constructor(service: PosConfigurationService);
    create(dto: CreatePosConfigurationDto, req: any): Promise<import("../../entities/billing").PosConfiguration>;
    findAll(query: QueryPosConfigurationDto, req: any): Promise<PaginatedPosConfigurationDto>;
    findOne(id: string, req: any): Promise<import("../../entities/billing").PosConfiguration>;
    update(id: string, dto: UpdatePosConfigurationDto, req: any): Promise<import("../../entities/billing").PosConfiguration>;
    remove(id: string, req: any): Promise<void>;
}
