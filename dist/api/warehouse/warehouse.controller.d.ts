import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { QueryWarehouseDto } from './dto/query-warehouse.dto';
import { PaginatedWarehouseDto } from './dto/paginated-warehouse.dto';
export declare class WarehouseController {
    private readonly service;
    constructor(service: WarehouseService);
    create(dto: CreateWarehouseDto, req: any): Promise<import("../../entities/warehouse").Warehouse>;
    findAll(query: QueryWarehouseDto, req: any): Promise<PaginatedWarehouseDto>;
    findOne(id: string, req: any): Promise<import("../../entities/warehouse").Warehouse>;
    update(id: string, dto: UpdateWarehouseDto, req: any): Promise<import("../../entities/warehouse").Warehouse>;
    remove(id: string, req: any): Promise<void>;
}
