import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

@Injectable()
export class ProductAttributeAssignmentService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductAttributeValue)
    private readonly valueRepository: Repository<ProductAttributeValue>,
    @InjectRepository(ProductAttributeAssignment)
    private readonly assignmentRepository: Repository<ProductAttributeAssignment>,
  ) {}

  async findAll(productId: string, tenantId: string): Promise<ProductAssignedAttributeGroup[]> {
    await this.assertProduct(productId, tenantId);
    const assignments = await this.loadAssignments(productId);
    return this.groupAssignments(assignments);
  }

  async assign(
    productId: string,
    dto: AssignProductAttributeValueDto,
    tenantId: string,
  ): Promise<ProductAssignedAttributeGroup[]> {
    await this.assertProduct(productId, tenantId);
    await this.assertCatalogValues(tenantId, [dto.attribute_value_id]);

    const existing = await this.assignmentRepository.findOne({
      where: { product_id: productId, attribute_value_id: dto.attribute_value_id },
    });
    if (existing) {
      throw new ConflictException('Este valor ya está asignado al producto');
    }

    await this.assignmentRepository.save(
      this.assignmentRepository.create({
        product_id: productId,
        attribute_value_id: dto.attribute_value_id,
      }),
    );

    return this.findAll(productId, tenantId);
  }

  async replaceAll(
    productId: string,
    dto: ReplaceProductAttributeAssignmentsDto,
    tenantId: string,
  ): Promise<ProductAssignedAttributeGroup[]> {
    await this.assertProduct(productId, tenantId);
    const uniqueIds = [...new Set(dto.attribute_value_ids)];
    await this.assertCatalogValues(tenantId, uniqueIds);

    await this.assignmentRepository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(ProductAttributeAssignment);
      await repo.delete({ product_id: productId });
      if (uniqueIds.length === 0) {
        return;
      }
      await repo.save(
        uniqueIds.map((attribute_value_id) =>
          repo.create({ product_id: productId, attribute_value_id }),
        ),
      );
    });

    return this.findAll(productId, tenantId);
  }

  async remove(
    assignmentId: string,
    productId: string,
    tenantId: string,
  ): Promise<ProductAssignedAttributeGroup[]> {
    await this.assertProduct(productId, tenantId);

    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId, product_id: productId },
    });
    if (!assignment) {
      throw new NotFoundException('Asignación de atributo no encontrada');
    }

    await this.assignmentRepository.remove(assignment);
    return this.findAll(productId, tenantId);
  }

  private async assertProduct(productId: string, tenantId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenant_id: tenantId },
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }
    return product;
  }

  private async assertCatalogValues(tenantId: string, valueIds: string[]): Promise<void> {
    if (valueIds.length === 0) {
      return;
    }

    const values = await this.valueRepository.find({
      where: { id: In(valueIds) },
      relations: ['attribute'],
    });

    if (values.length !== valueIds.length) {
      throw new NotFoundException('Uno o más valores de atributo no existen');
    }

    const foreign = values.find((value) => value.attribute?.tenant_id !== tenantId);
    if (foreign) {
      throw new NotFoundException('Uno o más valores de atributo no existen');
    }
  }

  private loadAssignments(productId: string): Promise<ProductAttributeAssignment[]> {
    return this.assignmentRepository.find({
      where: { product_id: productId },
      relations: ['attribute_value', 'attribute_value.attribute'],
    });
  }

  private groupAssignments(
    assignments: ProductAttributeAssignment[],
  ): ProductAssignedAttributeGroup[] {
    const groups = new Map<string, ProductAssignedAttributeGroup>();

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
        values: [...group.values].sort(
          (a, b) => a.display_order - b.display_order || a.value.localeCompare(b.value),
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
