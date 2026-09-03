import { ProductAttributeService } from './product-attribute.service';
import { CreateProductAttributeDto } from './dto/create-product-attribute.dto';
import { UpdateProductAttributeDto } from './dto/update-product-attribute.dto';
import { QueryProductAttributeDto } from './dto/query-product-attribute.dto';
import { CreateProductAttributeValueDto } from './dto/create-product-attribute-value.dto';
import { UpdateProductAttributeValueDto } from './dto/update-product-attribute-value.dto';
export declare class ProductAttributeController {
    private readonly productAttributeService;
    constructor(productAttributeService: ProductAttributeService);
    createAttribute(dto: CreateProductAttributeDto, req: any): Promise<import("../../entities/products").ProductAttribute>;
    findAllAttributes(query: QueryProductAttributeDto, req: any): Promise<{
        data: import("../../entities/products").ProductAttribute[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOptions(req: any): Promise<{
        id: string;
        name: string;
        values: {
            id: string;
            value: string;
            display_order: number;
        }[];
    }[]>;
    findAttributeById(attributeId: string, req: any): Promise<import("../../entities/products").ProductAttribute>;
    updateAttribute(attributeId: string, dto: UpdateProductAttributeDto, req: any): Promise<import("../../entities/products").ProductAttribute>;
    removeAttribute(attributeId: string, req: any): Promise<void>;
    createValue(attributeId: string, dto: CreateProductAttributeValueDto, req: any): Promise<import("../../entities/products").ProductAttributeValue>;
    findAllValues(attributeId: string, req: any): Promise<import("../../entities/products").ProductAttributeValue[]>;
    updateValue(attributeId: string, valueId: string, dto: UpdateProductAttributeValueDto, req: any): Promise<import("../../entities/products").ProductAttributeValue>;
    removeValue(attributeId: string, valueId: string, req: any): Promise<void>;
}
