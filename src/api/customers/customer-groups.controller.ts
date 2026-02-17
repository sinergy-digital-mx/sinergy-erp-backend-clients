import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { CustomerGroupsService } from './customer-groups.service';
import { CreateCustomerGroupDto } from './dto/create-customer-group.dto';
import { UpdateCustomerGroupDto } from './dto/update-customer-group.dto';

@Controller('tenant/customer-groups')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CustomerGroupsController {
    constructor(
        private groupsService: CustomerGroupsService,
        private tenantContext: TenantContextService,
    ) {}

    @Post()
    @RequirePermissions({ entityType: 'CustomerGroup', action: 'Create' })
    async create(@Body() dto: CreateCustomerGroupDto) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) throw new Error('Tenant context is required');
        return this.groupsService.create(dto, tenantId);
    }

    @Get()
    @RequirePermissions({ entityType: 'CustomerGroup', action: 'Read' })
    async findAll() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) throw new Error('Tenant context is required');
        return this.groupsService.findAll(tenantId);
    }

    @Get('stats')
    @RequirePermissions({ entityType: 'CustomerGroup', action: 'Read' })
    async getStats() {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) throw new Error('Tenant context is required');
        return this.groupsService.getGroupStats(tenantId);
    }

    @Get(':id')
    @RequirePermissions({ entityType: 'CustomerGroup', action: 'Read' })
    async findOne(@Param('id') id: string) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) throw new Error('Tenant context is required');
        return this.groupsService.findOne(id, tenantId);
    }

    @Put(':id')
    @RequirePermissions({ entityType: 'CustomerGroup', action: 'Update' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCustomerGroupDto,
    ) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) throw new Error('Tenant context is required');
        return this.groupsService.update(id, dto, tenantId);
    }

    @Delete(':id')
    @RequirePermissions({ entityType: 'CustomerGroup', action: 'Delete' })
    async remove(@Param('id') id: string) {
        const tenantId = this.tenantContext.getCurrentTenantId();
        if (!tenantId) throw new Error('Tenant context is required');
        return this.groupsService.remove(id, tenantId);
    }
}
