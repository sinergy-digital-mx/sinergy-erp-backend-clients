import { Repository } from 'typeorm';
import { PriceList } from '../../entities/products/price-list.entity';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';
export declare class PriceListService {
    private readonly priceListRepository;
    constructor(priceListRepository: Repository<PriceList>);
    create(dto: CreatePriceListDto, tenantId: string): Promise<PriceList>;
    findAll(tenantId: string): Promise<PriceList[]>;
    findOne(id: string, tenantId: string): Promise<PriceList>;
    update(id: string, dto: UpdatePriceListDto, tenantId: string): Promise<PriceList>;
    remove(id: string, tenantId: string): Promise<void>;
}
