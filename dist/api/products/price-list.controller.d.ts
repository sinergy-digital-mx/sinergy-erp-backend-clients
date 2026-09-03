import { PriceListService } from './price-list.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';
export declare class PriceListController {
    private readonly priceListService;
    constructor(priceListService: PriceListService);
    create(dto: CreatePriceListDto, req: any): Promise<import("../../entities/products").PriceList>;
    findAll(req: any): Promise<import("../../entities/products").PriceList[]>;
    findOne(id: string, req: any): Promise<import("../../entities/products").PriceList>;
    update(id: string, dto: UpdatePriceListDto, req: any): Promise<import("../../entities/products").PriceList>;
    remove(id: string, req: any): Promise<void>;
}
