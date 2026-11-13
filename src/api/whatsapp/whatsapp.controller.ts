import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import {
  QueryWhatsappMessagesDto,
  SendWhatsappFileDto,
  SendWhatsappTextDto,
  WhatsappPairingCodeDto,
} from './dto/whatsapp.dto';
import { WhatsappMessageService } from './services/whatsapp-message.service';
import { WhatsappSessionService } from './services/whatsapp-session.service';
import { WHATSAPP_ENTITY_CODE } from './whatsapp.constants';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@Controller('tenant/whatsapp')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class WhatsappController {
  constructor(
    private readonly sessions: WhatsappSessionService,
    private readonly messages: WhatsappMessageService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('session')
  @RequirePermissions({ entityType: WHATSAPP_ENTITY_CODE, action: 'Read' })
  @ApiOperation({ summary: 'Estado de la conexión de WhatsApp' })
  status() {
    return this.sessions.getStatus(this.tenantId());
  }

  @Post('session/connect')
  @HttpCode(200)
  @RequirePermissions({ entityType: WHATSAPP_ENTITY_CODE, action: 'Update' })
  @ApiOperation({ summary: 'Iniciar la conexión (genera el QR si hace falta)' })
  connect() {
    return this.sessions.connect(this.tenantId(), this.userId());
  }

  @Get('session/qr')
  @RequirePermissions({ entityType: WHATSAPP_ENTITY_CODE, action: 'Update' })
  @ApiOperation({ summary: 'QR vigente para vincular el teléfono' })
  qr() {
    return this.sessions.qr(this.tenantId());
  }

  @Post('session/pairing-code')
  @HttpCode(200)
  @RequirePermissions({ entityType: WHATSAPP_ENTITY_CODE, action: 'Update' })
  @ApiOperation({ summary: 'Código para vincular con número de teléfono (alternativa al QR)' })
  pairingCode(@Body() dto: WhatsappPairingCodeDto) {
    return this.sessions.pairingCode(this.tenantId(), dto.phone);
  }

  @Post('session/restart')
  @HttpCode(200)
  @RequirePermissions({ entityType: WHATSAPP_ENTITY_CODE, action: 'Update' })
  @ApiOperation({ summary: 'Reiniciar la sesión de WhatsApp' })
  restart() {
    return this.sessions.restart(this.tenantId(), this.userId());
  }

  @Post('session/logout')
  @HttpCode(200)
  @RequirePermissions({ entityType: WHATSAPP_ENTITY_CODE, action: 'Update' })
  @ApiOperation({ summary: 'Desvincular el teléfono' })
  logout() {
    return this.sessions.logout(this.tenantId(), this.userId());
  }

  @Delete('session')
  @RequirePermissions({ entityType: WHATSAPP_ENTITY_CODE, action: 'Delete' })
  @ApiOperation({ summary: 'Eliminar la conexión de WhatsApp' })
  async remove() {
    await this.sessions.remove(this.tenantId());
    return { ok: true };
  }

  @Get('groups')
  @RequirePermissions({ entityType: WHATSAPP_ENTITY_CODE, action: 'Read' })
  @ApiOperation({ summary: 'Grupos de WhatsApp de la sesión conectada' })
  groups() {
    return this.sessions.listGroups(this.tenantId());
  }

  @Post('messages/text')
  @HttpCode(202)
  @RequirePermissions({ entityType: WHATSAPP_ENTITY_CODE, action: 'Create' })
  @ApiOperation({ summary: 'Enviar un mensaje de texto (entra a la cola de envío)' })
  sendText(@Body() dto: SendWhatsappTextDto) {
    return this.messages.sendText(this.tenantId(), this.userId(), dto);
  }

  @Post('messages/file')
  @HttpCode(202)
  @RequirePermissions({ entityType: WHATSAPP_ENTITY_CODE, action: 'Create' })
  @ApiOperation({ summary: 'Enviar un archivo por URL https (entra a la cola de envío)' })
  sendFile(@Body() dto: SendWhatsappFileDto) {
    return this.messages.sendFile(this.tenantId(), this.userId(), dto);
  }

  @Get('messages')
  @RequirePermissions({ entityType: WHATSAPP_ENTITY_CODE, action: 'Read' })
  @ApiOperation({ summary: 'Historial de mensajes enviados' })
  list(@Query() query: QueryWhatsappMessagesDto) {
    return this.messages.list(this.tenantId(), query);
  }

  @Get('messages/:id')
  @RequirePermissions({ entityType: WHATSAPP_ENTITY_CODE, action: 'Read' })
  @ApiOperation({ summary: 'Detalle y estado de un mensaje' })
  findOne(@Param('id') id: string) {
    return this.messages.findOne(this.tenantId(), id);
  }

  private tenantId(): string {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) throw new Error('Se requiere el contexto de la organización');
    return tenantId;
  }

  private userId(): string {
    const userId = this.tenantContext.getCurrentUserId();
    if (!userId) throw new Error('Se requiere el contexto de la organización');
    return userId;
  }
}
