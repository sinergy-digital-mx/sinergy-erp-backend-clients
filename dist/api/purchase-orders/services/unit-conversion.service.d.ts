import { Repository } from 'typeorm';
import { ProductUoM } from '../../../entities/products';
export declare class UnitConversionService {
    private readonly productUomRepository;
    private readonly logger;
    constructor(productUomRepository: Repository<ProductUoM>);
    getProductUomsByProductId(productId: string): Promise<any[]>;
    getProductUomId(uomId: string, productId: string): Promise<string>;
    getConversionFactor(productUomId: string): Promise<number>;
    getBaseUom(productId: string): Promise<string>;
    convertToBaseUnit(quantity: number, productUomId: string, productId: string): Promise<number>;
}
