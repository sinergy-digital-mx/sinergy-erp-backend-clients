import { Repository } from 'typeorm';
import { Product } from '../../entities/products/product.entity';
import { ProductAttributeValue } from '../../entities/products/product-attribute-value.entity';
import { ProductAttributeAssignment } from '../../entities/products/product-attribute-assignment.entity';
import { AssignProductAttributeValueDto } from './dto/assign-product-attribute-value.dto';
import { ReplaceProductAttributeAssignmentsDto } from './dto/replace-product-attribute-assignments.dto';
export type ProductAssignedAttributeValue = {
    assignment_id: string;
    attribute_value_id: string;
    value: string;
    display_order: number;
};
export type ProductAssignedAttributeGroup = {
    attribute_id: string;
    name: string;
    values: ProductAssignedAttributeValue[];
};
export declare class ProductAttributeAssignmentService {
    private readonly productRepository;
    private readonly valueRepository;
    private readonly assignmentRepository;
    constructor(productRepository: Repository<Product>, valueRepository: Repository<ProductAttributeValue>, assignmentRepository: Repository<ProductAttributeAssignment>);
    findAll(productId: string, tenantId: string): Promise<ProductAssignedAttributeGroup[]>;
    assign(productId: string, dto: AssignProductAttributeValueDto, tenantId: string): Promise<ProductAssignedAttributeGroup[]>;
    replaceAll(productId: string, dto: ReplaceProductAttributeAssignmentsDto, tenantId: string): Promise<ProductAssignedAttributeGroup[]>;
    remove(assignmentId: string, productId: string, tenantId: string): Promise<ProductAssignedAttributeGroup[]>;
    private assertProduct;
    private assertCatalogValues;
    private loadAssignments;
    private groupAssignments;
}
