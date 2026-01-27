// src/api/leads/leads.controller.ts
import {
    Controller,
    Post,
    Put,
    Get,
    Body,
    Param,
    Req,
    UseGuards,
    Delete,
    ParseIntPipe,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('leads')
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) { }

    @Post()
    @RequirePermissions({ entityType: 'Lead', action: 'Create' })
    create(@Body() dto: CreateLeadDto, @Req() req) {
        return this.leadsService.create(dto, req.user.tenantId);
    }

    @Put(':id')
    @RequirePermissions({ entityType: 'Lead', action: 'Update' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeadDto, @Req() req) {
        return this.leadsService.update(id, dto, req.user.tenantId);
    }

    @Get()
    @RequirePermissions({ entityType: 'Lead', action: 'Read' })
    findAll(@Req() req) {
        return this.leadsService.findAll(req.user.tenantId);
    }

    @Get(':id')
    @RequirePermissions({ entityType: 'Lead', action: 'Read' })
    findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.leadsService.findOne(id, req.user.tenantId);
    }

    @Delete(':id')
    @RequirePermissions({ entityType: 'Lead', action: 'Delete' })
    remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
        // Note: This assumes you'll add a remove method to LeadsService
        // return this.leadsService.remove(id, req.user.tenantId);
        throw new Error('Delete functionality not yet implemented in service');
    }
}
