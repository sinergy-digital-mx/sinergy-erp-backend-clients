// src/customers/customers.controller.ts
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
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import {
    RequireCustomerCreate,
    RequireCustomerRead,
    RequireCustomerUpdate,
    RequireCustomerDelete,
} from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('customers')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Post()
    @RequireCustomerCreate()
    create(@Body() dto: CreateCustomerDto, @Req() req) {
        return this.customersService.create(dto, req.user.tenant_id);
    }

    @Put(':id')
    @RequireCustomerUpdate()
    update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @Req() req) {
        return this.customersService.update(Number(id), dto, req.user.tenant_id);
    }

    @Get()
    @RequireCustomerRead()
    findAll(@Req() req) {
        return this.customersService.findAll(req.user.tenant_id);
    }

    @Get(':id')
    @RequireCustomerRead()
    findOne(@Param('id') id: string, @Req() req) {
        return this.customersService.findOne(Number(id), req.user.tenant_id);
    }

    @Delete(':id')
    @RequireCustomerDelete()
    remove(@Param('id') id: string, @Req() req) {
        // Note: This assumes you'll add a remove method to CustomersService
        // return this.customersService.remove(Number(id), req.user.tenant_id);
        throw new Error('Delete functionality not yet implemented in service');
    }
}
