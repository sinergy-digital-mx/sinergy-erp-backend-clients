import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UoMService } from '../services/uom.service';
import { CreateUoMDto } from '../dto/create-uom.dto';
import { CreateUoMRelationshipDto } from '../dto/create-uom-relationship.dto';
import { ConvertQuantityDto } from '../dto/convert-quantity.dto';
import { UoM } from '../../../entities/products/uom.entity';
import { UoMRelationship } from '../../../entities/products/uom-relationship.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tenant/products/:productId/uoms')
export class UoMController {
  constructor(private uomService: UoMService) {}

  // Rutas específicas primero (antes de rutas con parámetros dinámicos)
  @Get('catalog')
  async listCatalog(): Promise<any[]> {
    return this.uomService.listCatalogUoMs();
  }

  @Get('relationships')
  async listRelationships(@Param('productId') productId: string): Promise<UoMRelationship[]> {
    return this.uomService.getRelationships(productId);
  }

  @Post('relationships')
  async createRelationship(
    @Param('productId') productId: string,
    @Body() dto: CreateUoMRelationshipDto,
  ): Promise<UoMRelationship> {
    return this.uomService.createRelationship(
      productId,
      dto.source_uom_id,
      dto.target_uom_id,
      dto.conversion_factor,
    );
  }

  @Delete('relationships/:relationshipId')
  async deleteRelationship(@Param('relationshipId') relationshipId: string): Promise<void> {
    return this.uomService.deleteRelationship(relationshipId);
  }

  @Post('convert')
  async convert(
    @Param('productId') productId: string,
    @Body() dto: ConvertQuantityDto,
  ): Promise<{ converted_quantity: number }> {
    const convertedQuantity = await this.uomService.convertQuantity(
      productId,
      dto.quantity,
      dto.from_uom_id,
      dto.to_uom_id,
    );
    return { converted_quantity: convertedQuantity };
  }

  // Rutas genéricas después
  @Post()
  async assignFromCatalog(
    @Param('productId') productId: string,
    @Body() dto: CreateUoMDto,
  ): Promise<UoM> {
    return this.uomService.assignUoMFromCatalog(productId, dto.uom_catalog_id);
  }

  @Get()
  async list(@Param('productId') productId: string): Promise<UoM[]> {
    return this.uomService.getUoMsByProduct(productId);
  }

  // Rutas con parámetros dinámicos al final
  @Get(':uomId')
  async getById(@Param('uomId') uomId: string): Promise<UoM> {
    return this.uomService.getUoM(uomId);
  }

  @Delete(':uomId')
  async delete(@Param('uomId') uomId: string): Promise<void> {
    return this.uomService.deleteUoM(uomId);
  }
}
