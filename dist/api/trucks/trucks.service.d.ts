import { Repository } from 'typeorm';
import { Truck } from '../../entities/logistics/truck.entity';
import { Shipping } from '../../entities/logistics/shipping.entity';
import { S3Service } from '../../common/services/s3.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { QueryTruckDto } from './dto/query-truck.dto';
export declare class TrucksService {
    private readonly repo;
    private readonly shippingRepo;
    private readonly s3Service;
    constructor(repo: Repository<Truck>, shippingRepo: Repository<Shipping>, s3Service: S3Service);
    create(dto: CreateTruckDto, tenantId: string): Promise<Truck>;
    findAll(tenantId: string, query?: QueryTruckDto): Promise<{
        data: Truck[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    findOne(id: string, tenantId: string): Promise<Truck>;
    update(id: string, dto: UpdateTruckDto, tenantId: string): Promise<Truck>;
    deactivate(id: string, tenantId: string): Promise<Truck>;
    uploadPhoto(id: string, tenantId: string, file: Express.Multer.File): Promise<Truck>;
    private sanitizeGps;
    private assertGpsUnitUnique;
    private present;
    private presentMany;
    private getByIdOrFail;
    private toResponseWithPhotoUrl;
    private assertPlacaUnique;
}
