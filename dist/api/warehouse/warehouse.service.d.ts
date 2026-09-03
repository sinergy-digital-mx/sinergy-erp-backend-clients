import { Repository } from 'typeorm';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { QueryWarehouseDto } from './dto/query-warehouse.dto';
import { PaginatedWarehouseDto } from './dto/paginated-warehouse.dto';
export declare class WarehouseService {
    private repo;
    constructor(repo: Repository<Warehouse>);
    create(dto: CreateWarehouseDto, tenantId: string): Promise<Warehouse>;
    findAll(tenantId: string, query?: QueryWarehouseDto): Promise<PaginatedWarehouseDto>;
    findOne(id: string, tenantId: string): Promise<Warehouse>;
    update(id: string, dto: UpdateWarehouseDto, tenantId: string): Promise<Warehouse>;
    remove(id: string, tenantId: string): Promise<void>;
}
