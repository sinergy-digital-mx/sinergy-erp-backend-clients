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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
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
@ApiTags('Customers')
@ApiBearerAuth()
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Post()
    @RequireCustomerCreate()
    @ApiOperation({ summary: 'Create a new customer' })
    @ApiBody({ type: CreateCustomerDto })
    @ApiResponse({ status: 201, description: 'Customer created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    create(@Body() dto: CreateCustomerDto, @Req() req) {
        return this.customersService.create(dto, req.user.tenant_id);
    }

    @Put(':id')
    @RequireCustomerUpdate()
    @ApiOperation({ summary: 'Update an existing customer' })
    @ApiParam({ name: 'id', type: 'string', description: 'Customer ID' })
    @ApiBody({ type: UpdateCustomerDto })
    @ApiResponse({ status: 200, description: 'Customer updated successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Customer does not exist' })
    update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @Req() req) {
        return this.customersService.update(Number(id), dto, req.user.tenant_id);
    }

    @Get()
    @RequireCustomerRead()
    @ApiOperation({ summary: 'Get all customers for the current tenant' })
    @ApiResponse({ status: 200, description: 'List of customers retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    findAll(@Req() req) {
        return this.customersService.findAll(req.user.tenant_id);
    }

    @Get(':id')
    @RequireCustomerRead()
    @ApiOperation({ summary: 'Get a specific customer by ID' })
    @ApiParam({ name: 'id', type: 'string', description: 'Customer ID' })
    @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Customer does not exist' })
    findOne(@Param('id') id: string, @Req() req) {
        return this.customersService.findOne(Number(id), req.user.tenant_id);
    }

    @Delete(':id')
    @RequireCustomerDelete()
    @ApiOperation({ summary: 'Delete a customer by ID' })
    @ApiParam({ name: 'id', type: 'string', description: 'Customer ID' })
    @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Customer does not exist' })
    @ApiResponse({ status: 501, description: 'Not implemented - Delete functionality not yet available' })
    remove(@Param('id') id: string, @Req() req) {
        // Note: This assumes you'll add a remove method to CustomersService
        // return this.customersService.remove(Number(id), req.user.tenant_id);
        throw new Error('Delete functionality not yet implemented in service');
    }
}
