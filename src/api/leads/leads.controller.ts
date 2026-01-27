// src/leads/leads.controller.ts
import { Controller, Post, Put, Get, Body, Param } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Controller('leads')
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) { }

    @Post()
    create(@Body() dto: CreateLeadDto) {
        return this.leadsService.create(dto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
        return this.leadsService.update(Number(id), dto);
    }

    @Get()
    findAll() {
        return this.leadsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.leadsService.findOne(Number(id));
    }
}
