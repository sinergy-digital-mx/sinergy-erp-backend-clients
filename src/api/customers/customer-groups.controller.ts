import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    UseGuards,
    HttpCode,
    HttpStatus,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CustomerGroupsService } from './customer-groups.service';
import { CreateCustomerGroupDto } from './dto/create-customer-group.dto';
import { UpdateCustomerGroupDto } from './dto/update-customer-group.dto';

@ApiTags('Customer Groups')
@ApiBearerAuth()
@Controller('tenant/customer-groups')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CustomerGroupsController {
    constructor(private groupsService: CustomerGroupsService) {}

    @Post()
    @RequirePermissions({ entityType: 'CustomerGroup', action: 'Create' })
    @ApiOperation({ summary: 'Crear grupo de clientes de esta organización' })
    @ApiResponse({ status: 201, description: 'Grupo creado' })
    @ApiResponse({ status: 409, description: 'Nombre duplicado' })
    async create(@Body() dto: CreateCustomerGroupDto, @Req() req) {
        return this.groupsService.create(dto, this.organizationId(req));
    }

    @Get()
    @RequirePermissions({ entityType: 'CustomerGroup', action: 'Read' })
    @ApiOperation({ summary: 'Listar grupos de clientes de esta organización' })
    async findAll(@Req() req) {
        return this.groupsService.findAll(this.organizationId(req));
    }

    @Get(':id')
    @RequirePermissions({ entityType: 'CustomerGroup', action: 'Read' })
    @ApiOperation({ summary: 'Detalle de un grupo de clientes' })
    @ApiParam({ name: 'id', description: 'UUID del grupo' })
    @ApiResponse({ status: 404, description: 'El grupo no existe' })
    async findOne(@Param('id') id: string, @Req() req) {
        return this.groupsService.findOne(id, this.organizationId(req));
    }

    @Put(':id')
    @RequirePermissions({ entityType: 'CustomerGroup', action: 'Update' })
    @ApiOperation({ summary: 'Actualizar nombre o descripción del grupo' })
    @ApiParam({ name: 'id', description: 'UUID del grupo' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCustomerGroupDto,
        @Req() req,
    ) {
        return this.groupsService.update(id, dto, this.organizationId(req));
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermissions({ entityType: 'CustomerGroup', action: 'Delete' })
    @ApiOperation({ summary: 'Eliminar un grupo sin clientes asignados' })
    @ApiParam({ name: 'id', description: 'UUID del grupo' })
    async remove(@Param('id') id: string, @Req() req) {
        return this.groupsService.remove(id, this.organizationId(req));
    }

    private organizationId(req: { user?: { tenantId?: string; tenant_id?: string } }): string {
        const organizationId = req.user?.tenantId ?? req.user?.tenant_id;
        if (!organizationId) {
            throw new UnauthorizedException(
                'El contexto de la organización es obligatorio',
            );
        }
        return organizationId;
    }
}
