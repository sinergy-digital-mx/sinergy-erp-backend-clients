import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { EmailTemplatesService, RenderedEmailTemplate } from './email-templates.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { QueryEmailTemplateDto } from './dto/query-email-template.dto';
import { PreviewEmailTemplateDto, RenderEmailTemplateDto } from './dto/render-email-template.dto';
import { SendEmailTemplateDto } from './dto/send-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { EmailTemplate } from '../../entities/email-templates/email-template.entity';
import { AvailableEmailTemplateEntityDto } from './dto/email-template-variable.dto';
import { SentEmailTemplateResult } from './email-templates.service';

@Controller('tenant/email-templates')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('Email Templates')
@ApiBearerAuth()
export class EmailTemplatesController {
  constructor(
    private readonly service: EmailTemplatesService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'email-templates', action: 'Create' })
  @ApiOperation({ summary: 'Create an email template for the current tenant' })
  @ApiResponse({ status: 201, description: 'Email template created' })
  async create(@Body() dto: CreateEmailTemplateDto): Promise<EmailTemplate> {
    const { tenantId, userId } = this.requireTenantContext();
    return this.service.create(tenantId, dto, userId);
  }

  @Get()
  @RequirePermissions({ entityType: 'email-templates', action: 'Read' })
  @ApiOperation({ summary: 'List email templates for the current tenant' })
  async findAll(
    @Query() query: QueryEmailTemplateDto,
  ): Promise<{ data: EmailTemplate[]; total: number; page: number; limit: number; totalPages: number }> {
    const { tenantId } = this.requireTenantContext();
    return this.service.findAll(tenantId, query);
  }

  @Get('variables')
  @RequirePermissions({ entityType: 'email-templates', action: 'Read' })
  @ApiOperation({ summary: 'Get template variables available for the current tenant' })
  async getAvailableVariables(): Promise<AvailableEmailTemplateEntityDto[]> {
    const { tenantId } = this.requireTenantContext();
    return this.service.getAvailableVariables(tenantId);
  }

  @Post('preview')
  @RequirePermissions({ entityType: 'email-templates', action: 'Read' })
  @ApiOperation({ summary: 'Render an unsaved email template preview' })
  async preview(@Body() dto: PreviewEmailTemplateDto): Promise<RenderedEmailTemplate> {
    const { tenantId } = this.requireTenantContext();
    return this.service.preview(tenantId, dto);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'email-templates', action: 'Read' })
  @ApiOperation({ summary: 'Get an email template by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  async findOne(@Param('id') id: string): Promise<EmailTemplate> {
    const { tenantId } = this.requireTenantContext();
    return this.service.findOne(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions({ entityType: 'email-templates', action: 'Update' })
  @ApiOperation({ summary: 'Update an email template' })
  @ApiParam({ name: 'id', type: 'string' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    const { tenantId, userId } = this.requireTenantContext();
    return this.service.update(tenantId, id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'email-templates', action: 'Delete' })
  @ApiOperation({ summary: 'Delete an email template' })
  @ApiParam({ name: 'id', type: 'string' })
  async remove(@Param('id') id: string): Promise<void> {
    const { tenantId, userId } = this.requireTenantContext();
    return this.service.remove(tenantId, id, userId);
  }

  @Post(':id/render')
  @RequirePermissions({ entityType: 'email-templates', action: 'Read' })
  @ApiOperation({ summary: 'Render a saved email template with provided variables' })
  @ApiParam({ name: 'id', type: 'string' })
  async render(
    @Param('id') id: string,
    @Body() dto: RenderEmailTemplateDto,
  ): Promise<RenderedEmailTemplate> {
    const { tenantId } = this.requireTenantContext();
    return this.service.render(tenantId, id, dto);
  }

  @Post(':id/send')
  @RequirePermissions({ entityType: 'email-templates', action: 'Send' })
  @ApiOperation({ summary: 'Render and send a saved email template using the active tenant mailer configuration' })
  @ApiParam({ name: 'id', type: 'string' })
  async send(
    @Param('id') id: string,
    @Body() dto: SendEmailTemplateDto,
  ): Promise<SentEmailTemplateResult> {
    const { tenantId } = this.requireTenantContext();
    return this.service.send(tenantId, id, dto);
  }

  private requireTenantContext(): { tenantId: string; userId: string | null } {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return {
      tenantId,
      userId: this.tenantContext.getCurrentUserId(),
    };
  }
}
