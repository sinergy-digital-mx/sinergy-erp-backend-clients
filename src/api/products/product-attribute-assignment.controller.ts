import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';
import { ProductAttributeAssignmentService } from './product-attribute-assignment.service';
import { AssignProductAttributeValueDto } from './dto/assign-product-attribute-value.dto';
import { ReplaceProductAttributeAssignmentsDto } from './dto/replace-product-attribute-assignments.dto';

@ApiTags('Product Attribute Assignments')
@ApiBearerAuth()
@Controller('tenant/products/:productId/attributes')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductAttributeAssignmentController {
  constructor(
    private readonly assignmentService: ProductAttributeAssignmentService,
  ) {}

  @Get()
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Listar atributos asignados a este producto' })
  @ApiResponse({ status: 200, description: 'Atributos del producto, agrupados' })
  findAll(@Param('productId') productId: string, @Request() req) {
    return this.assignmentService.findAll(productId, req.user.tenant_id);
  }

  @Put()
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Reemplazar atributos asignados al producto' })
  @ApiResponse({ status: 200, description: 'Asignaciones actualizadas' })
  replaceAll(
    @Param('productId') productId: string,
    @Body() dto: ReplaceProductAttributeAssignmentsDto,
    @Request() req,
  ) {
    return this.assignmentService.replaceAll(productId, dto, req.user.tenant_id);
  }

  @Post()
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Asignar un valor de catálogo al producto' })
  @ApiResponse({ status: 201, description: 'Valor asignado' })
  @ApiResponse({ status: 409, description: 'El valor ya está asignado' })
  assign(
    @Param('productId') productId: string,
    @Body() dto: AssignProductAttributeValueDto,
    @Request() req,
  ) {
    return this.assignmentService.assign(productId, dto, req.user.tenant_id);
  }

  @Delete(':assignmentId')
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Quitar un valor asignado (no borra el catálogo)' })
  @ApiResponse({ status: 200, description: 'Asignación eliminada' })
  remove(
    @Param('productId') productId: string,
    @Param('assignmentId') assignmentId: string,
    @Request() req,
  ) {
    return this.assignmentService.remove(assignmentId, productId, req.user.tenant_id);
  }
}
