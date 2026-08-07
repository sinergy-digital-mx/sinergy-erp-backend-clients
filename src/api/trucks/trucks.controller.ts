import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { TrucksService } from './trucks.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { QueryTruckDto } from './dto/query-truck.dto';

@ApiTags('Trucks')
@Controller('tenant/trucks')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class TrucksController {
  constructor(private readonly service: TrucksService) {}

  @Post()
  @RequirePermissions({ entityType: 'Truck', action: 'Create' })
  @ApiOperation({ summary: 'Crear camión' })
  create(@Body() dto: CreateTruckDto, @Req() req: any) {
    return this.service.create(dto, req.user.tenant_id);
  }

  @Get()
  @RequirePermissions({ entityType: 'Truck', action: 'Read' })
  @ApiOperation({ summary: 'Listar camiones' })
  findAll(@Query() query: QueryTruckDto, @Req() req: any) {
    return this.service.findAll(req.user.tenant_id, query);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'Truck', action: 'Read' })
  @ApiOperation({ summary: 'Detalle de camión' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, req.user.tenant_id);
  }

  @Put(':id')
  @RequirePermissions({ entityType: 'Truck', action: 'Update' })
  @ApiOperation({ summary: 'Actualizar camión' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTruckDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, req.user.tenant_id);
  }

  @Post(':id/photo')
  @RequirePermissions({ entityType: 'Truck', action: 'Update' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir foto del camión' })
  uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No se envió ningún archivo');
    }
    return this.service.uploadPhoto(id, req.user.tenant_id, file);
  }

  @Delete(':id')
  @RequirePermissions({ entityType: 'Truck', action: 'Delete' })
  @ApiOperation({ summary: 'Desactivar camión (baja lógica)' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.deactivate(id, req.user.tenant_id);
  }
}
