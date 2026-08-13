import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';
import { ImportMadereriaInventoryDto } from './dto/import-inventory.dto';
import { ENTITY_CODE } from './madereria-inventory-import.constants';
import { MadereriaInventoryImportService } from './madereria-inventory-import.service';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/madereria-inventory-import')
@ApiTags('Madereria Importacion Inventario')
@ApiBearerAuth()
export class MadereriaInventoryImportController {
  constructor(private readonly service: MadereriaInventoryImportService) {}

  @Post()
  @RequirePermission(ENTITY_CODE, 'Create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Iniciar importación de inventario (async). Devuelve job_id para consultar progreso.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'file',
        'fiscal_configuration_id',
        'billing_branch_id',
        'warehouse_id',
      ],
      properties: {
        file: { type: 'string', format: 'binary' },
        fiscal_configuration_id: { type: 'string', format: 'uuid' },
        billing_branch_id: { type: 'string', format: 'uuid' },
        warehouse_id: { type: 'string', format: 'uuid' },
      },
    },
  })
  startImport(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportMadereriaInventoryDto,
    @Req() req: { user: { tenantId?: string; tenant_id?: string; id: string } },
  ) {
    if (!file) {
      throw new BadRequestException('Adjunta el archivo Excel de inventario');
    }
    const organizationId = req.user.tenantId ?? req.user.tenant_id;
    if (!organizationId) {
      throw new BadRequestException('No se pudo determinar la organización');
    }
    return this.service.startImportJob({
      organizationId,
      userId: req.user.id,
      fiscalConfigurationId: dto.fiscal_configuration_id,
      billingBranchId: dto.billing_branch_id,
      warehouseId: dto.warehouse_id,
      file,
    });
  }

  @Get('jobs/:jobId')
  @RequirePermission(ENTITY_CODE, 'Create')
  @ApiOperation({
    summary: 'Progreso / resultado de un trabajo de importación',
  })
  getJob(
    @Param('jobId') jobId: string,
    @Req() req: { user: { tenantId?: string; tenant_id?: string } },
  ) {
    const organizationId = req.user.tenantId ?? req.user.tenant_id;
    if (!organizationId) {
      throw new BadRequestException('No se pudo determinar la organización');
    }
    return this.service.getJobStatus(jobId, organizationId);
  }
}
