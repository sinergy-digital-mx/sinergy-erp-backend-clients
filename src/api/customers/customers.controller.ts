// src/customers/customers.controller.ts
import { Controller, Post, Put, Get, Body, Param } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Post()
    create(@Body() dto: CreateCustomerDto) {
        return this.customersService.create(dto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
        return this.customersService.update(Number(id), dto);
    }

    @Get()
    findAll() {
        return this.customersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.customersService.findOne(Number(id));
    }
}
