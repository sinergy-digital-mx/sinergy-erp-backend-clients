"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductAttributeAssignmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../../entities/products/product.entity");
const product_attribute_value_entity_1 = require("../../entities/products/product-attribute-value.entity");
const product_attribute_assignment_entity_1 = require("../../entities/products/product-attribute-assignment.entity");
let ProductAttributeAssignmentService = class ProductAttributeAssignmentService {
    productRepository;
    valueRepository;
    assignmentRepository;
    constructor(productRepository, valueRepository, assignmentRepository) {
        this.productRepository = productRepository;
        this.valueRepository = valueRepository;
        this.assignmentRepository = assignmentRepository;
    }
    async findAll(productId, tenantId) {
        await this.assertProduct(productId, tenantId);
        const assignments = await this.loadAssignments(productId);
        return this.groupAssignments(assignments);
    }
    async assign(productId, dto, tenantId) {
        await this.assertProduct(productId, tenantId);
        await this.assertCatalogValues(tenantId, [dto.attribute_value_id]);
        const existing = await this.assignmentRepository.findOne({
            where: { product_id: productId, attribute_value_id: dto.attribute_value_id },
        });
        if (existing) {
            throw new common_1.ConflictException('Este valor ya está asignado al producto');
        }
        await this.assignmentRepository.save(this.assignmentRepository.create({
            product_id: productId,
            attribute_value_id: dto.attribute_value_id,
        }));
        return this.findAll(productId, tenantId);
    }
    async replaceAll(productId, dto, tenantId) {
        await this.assertProduct(productId, tenantId);
        const uniqueIds = [...new Set(dto.attribute_value_ids)];
        await this.assertCatalogValues(tenantId, uniqueIds);
        await this.assignmentRepository.manager.transaction(async (manager) => {
            const repo = manager.getRepository(product_attribute_assignment_entity_1.ProductAttributeAssignment);
            await repo.delete({ product_id: productId });
            if (uniqueIds.length === 0) {
                return;
            }
            await repo.save(uniqueIds.map((attribute_value_id) => repo.create({ product_id: productId, attribute_value_id })));
        });
        return this.findAll(productId, tenantId);
    }
    async remove(assignmentId, productId, tenantId) {
        await this.assertProduct(productId, tenantId);
        const assignment = await this.assignmentRepository.findOne({
            where: { id: assignmentId, product_id: productId },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('Asignación de atributo no encontrada');
        }
        await this.assignmentRepository.remove(assignment);
        return this.findAll(productId, tenantId);
    }
    async assertProduct(productId, tenantId) {
        const product = await this.productRepository.findOne({
            where: { id: productId, tenant_id: tenantId },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Producto con ID ${productId} no encontrado`);
        }
        return product;
    }
    async assertCatalogValues(tenantId, valueIds) {
        if (valueIds.length === 0) {
            return;
        }
        const values = await this.valueRepository.find({
            where: { id: (0, typeorm_2.In)(valueIds) },
            relations: ['attribute'],
        });
        if (values.length !== valueIds.length) {
            throw new common_1.NotFoundException('Uno o más valores de atributo no existen');
        }
        const foreign = values.find((value) => value.attribute?.tenant_id !== tenantId);
        if (foreign) {
            throw new common_1.NotFoundException('Uno o más valores de atributo no existen');
        }
    }
    loadAssignments(productId) {
        return this.assignmentRepository.find({
            where: { product_id: productId },
            relations: ['attribute_value', 'attribute_value.attribute'],
        });
    }
    groupAssignments(assignments) {
        const groups = new Map();
        for (const assignment of assignments) {
            const value = assignment.attribute_value;
            const attribute = value?.attribute;
            if (!value || !attribute) {
                continue;
            }
            const group = groups.get(attribute.id) ?? {
                attribute_id: attribute.id,
                name: attribute.name,
                values: [],
            };
            group.values.push({
                assignment_id: assignment.id,
                attribute_value_id: value.id,
                value: value.value,
                display_order: value.display_order,
            });
            groups.set(attribute.id, group);
        }
        return [...groups.values()]
            .map((group) => ({
            ...group,
            values: [...group.values].sort((a, b) => a.display_order - b.display_order || a.value.localeCompare(b.value)),
        }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }
};
exports.ProductAttributeAssignmentService = ProductAttributeAssignmentService;
exports.ProductAttributeAssignmentService = ProductAttributeAssignmentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(product_attribute_value_entity_1.ProductAttributeValue)),
    __param(2, (0, typeorm_1.InjectRepository)(product_attribute_assignment_entity_1.ProductAttributeAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ProductAttributeAssignmentService);
//# sourceMappingURL=product-attribute-assignment.service.js.map