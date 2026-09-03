import { GlobalDiscountService } from './global-discount.service';
import { CreateGlobalDiscountDto } from './dto/create-global-discount.dto';
import { UpdateGlobalDiscountDto } from './dto/update-global-discount.dto';
export declare class GlobalDiscountController {
    private readonly globalDiscountService;
    constructor(globalDiscountService: GlobalDiscountService);
    findApplicable(req: any): Promise<import("./utils/global-discount.util").ApplicableGlobalDiscountSummary[]>;
    create(dto: CreateGlobalDiscountDto, req: any): Promise<import("../../entities/global-discounts/global-discount.entity").GlobalDiscount>;
    findAll(req: any): Promise<import("../../entities/global-discounts/global-discount.entity").GlobalDiscount[]>;
    findOne(id: string, req: any): Promise<import("../../entities/global-discounts/global-discount.entity").GlobalDiscount>;
    update(id: string, dto: UpdateGlobalDiscountDto, req: any): Promise<import("../../entities/global-discounts/global-discount.entity").GlobalDiscount>;
    remove(id: string, req: any): Promise<void>;
}
