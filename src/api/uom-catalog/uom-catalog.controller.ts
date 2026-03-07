import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { UoMCatalogService } from './uom-catalog.service';
import { CreateUoMCatalogDto } from './dto/create-uom-catalog.dto';
import { UpdateUoMCatalogDto } from './dto/update-uom-catalog.dto';
import { UoMCatalog } from '../../entities/products/uom-catalog.entity';

@Controller('uom-catalog')
export class UoMCatalogController {
  constructor(private service: UoMCatalogService) {}

  @Post()
  async create(@Body() dto: CreateUoMCatalogDto): Promise<UoMCatalog> {
    return this.service.create(dto);
  }

  @Get()
  async findAll(): Promise<UoMCatalog[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UoMCatalog> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUoMCatalogDto,
  ): Promise<UoMCatalog> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.service.delete(id);
  }
}
