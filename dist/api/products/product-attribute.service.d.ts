import { Repository } from 'typeorm';
import { ProductAttribute } from '../../entities/products/product-attribute.entity';
import { ProductAttributeValue } from '../../entities/products/product-attribute-value.entity';
import { CreateProductAttributeDto } from './dto/create-product-attribute.dto';
import { UpdateProductAttributeDto } from './dto/update-product-attribute.dto';
import { CreateProductAttributeValueDto } from './dto/create-product-attribute-value.dto';
import { UpdateProductAttributeValueDto } from './dto/update-product-attribute-value.dto';
import { QueryProductAttributeDto } from './dto/query-product-attribute.dto';
export declare class ProductAttributeService {
    private readonly attributeRepository;
    private readonly valueRepository;
    constructor(attributeRepository: Repository<ProductAttribute>, valueRepository: Repository<ProductAttributeValue>);
    createAttribute(dto: CreateProductAttributeDto, tenantId: string): Promise<ProductAttribute>;
    findOptions(tenantId: string): Promise<{
        id: string;
        name: string;
        values: {
            id: string;
            value: string;
            display_order: number;
        }[];
    }[]>;
    findAllAttributes(query: QueryProductAttributeDto, tenantId: string): Promise<{
        data: ProductAttribute[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findAttributeById(id: string, tenantId: string): Promise<ProductAttribute>;
    updateAttribute(id: string, dto: UpdateProductAttributeDto, tenantId: string): Promise<ProductAttribute>;
    removeAttribute(id: string, tenantId: string): Promise<void>;
    createValue(attributeId: string, dto: CreateProductAttributeValueDto, tenantId: string): Promise<ProductAttributeValue>;
    findAllValues(attributeId: string, tenantId: string): Promise<ProductAttributeValue[]>;
    findValueById(id: string, attributeId: string, tenantId: string): Promise<ProductAttributeValue>;
    updateValue(id: string, attributeId: string, dto: UpdateProductAttributeValueDto, tenantId: string): Promise<ProductAttributeValue>;
    removeValue(id: string, attributeId: string, tenantId: string): Promise<void>;
}
