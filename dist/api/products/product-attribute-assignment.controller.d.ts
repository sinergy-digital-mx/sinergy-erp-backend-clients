import { ProductAttributeAssignmentService } from './product-attribute-assignment.service';
import { AssignProductAttributeValueDto } from './dto/assign-product-attribute-value.dto';
import { ReplaceProductAttributeAssignmentsDto } from './dto/replace-product-attribute-assignments.dto';
export declare class ProductAttributeAssignmentController {
    private readonly assignmentService;
    constructor(assignmentService: ProductAttributeAssignmentService);
    findAll(productId: string, req: any): Promise<import("./product-attribute-assignment.service").ProductAssignedAttributeGroup[]>;
    replaceAll(productId: string, dto: ReplaceProductAttributeAssignmentsDto, req: any): Promise<import("./product-attribute-assignment.service").ProductAssignedAttributeGroup[]>;
    assign(productId: string, dto: AssignProductAttributeValueDto, req: any): Promise<import("./product-attribute-assignment.service").ProductAssignedAttributeGroup[]>;
    remove(productId: string, assignmentId: string, req: any): Promise<import("./product-attribute-assignment.service").ProductAssignedAttributeGroup[]>;
}
