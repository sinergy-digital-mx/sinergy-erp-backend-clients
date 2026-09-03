import { TrucksService } from './trucks.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { QueryTruckDto } from './dto/query-truck.dto';
export declare class TrucksController {
    private readonly service;
    constructor(service: TrucksService);
    create(dto: CreateTruckDto, req: any): Promise<import("../../entities/logistics/truck.entity").Truck>;
    findAll(query: QueryTruckDto, req: any): Promise<{
        data: import("../../entities/logistics/truck.entity").Truck[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    findOne(id: string, req: any): Promise<import("../../entities/logistics/truck.entity").Truck>;
    update(id: string, dto: UpdateTruckDto, req: any): Promise<import("../../entities/logistics/truck.entity").Truck>;
    uploadPhoto(id: string, file: Express.Multer.File, req: any): Promise<import("../../entities/logistics/truck.entity").Truck>;
    remove(id: string, req: any): Promise<import("../../entities/logistics/truck.entity").Truck>;
}
