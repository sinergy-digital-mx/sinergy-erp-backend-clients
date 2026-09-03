import { Repository } from 'typeorm';
import { GlobalDiscount } from '../../entities/global-discounts/global-discount.entity';
import { CreateGlobalDiscountDto } from './dto/create-global-discount.dto';
import { UpdateGlobalDiscountDto } from './dto/update-global-discount.dto';
export declare class GlobalDiscountService {
    private readonly globalDiscountRepository;
    constructor(globalDiscountRepository: Repository<GlobalDiscount>);
    private validateDiscountValue;
    private validateDateRange;
    create(dto: CreateGlobalDiscountDto, tenantId: string): Promise<GlobalDiscount>;
    findAll(tenantId: string): Promise<GlobalDiscount[]>;
    findApplicable(tenantId: string): Promise<import("./utils/global-discount.util").ApplicableGlobalDiscountSummary[]>;
    findOne(id: string, tenantId: string): Promise<GlobalDiscount>;
    findByIdForOrder(id: string, tenantId: string): Promise<GlobalDiscount>;
    update(id: string, dto: UpdateGlobalDiscountDto, tenantId: string): Promise<GlobalDiscount>;
    remove(id: string, tenantId: string): Promise<void>;
}
