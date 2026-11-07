import { QueryPriceUpdateDto } from './dto/query-price-update.dto';
import { UpdatePriceUpdateRowDto } from './dto/update-price-update-row.dto';
import { PriceUpdatesService } from './price-updates.service';
export declare class PriceUpdatesController {
    private readonly priceUpdatesService;
    constructor(priceUpdatesService: PriceUpdatesService);
    getSheet(query: QueryPriceUpdateDto, req: {
        user: {
            tenant_id: string;
        };
    }): Promise<import("./price-updates.service").PriceUpdateSheet>;
    updateRow(productId: string, dto: UpdatePriceUpdateRowDto, req: {
        user: {
            tenant_id: string;
        };
    }): Promise<import("./price-updates.service").PriceUpdateRowView>;
}
