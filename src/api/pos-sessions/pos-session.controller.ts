import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PosSessionService } from './pos-session.service';
import { OpenPosSessionDto } from './dto/open-pos-session.dto';
import { ClosePosSessionDto } from './dto/close-pos-session.dto';
import { QueryPosSessionDto } from './dto/query-pos-session.dto';
import { PaginatedPosSessionDto } from './dto/paginated-pos-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('POS Sessions')
@ApiBearerAuth()
@Controller('tenant/pos-sessions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PosSessionController {
  constructor(private readonly posSessionService: PosSessionService) {}

  @Post('open')
  @RequirePermission('PosSession', 'Create')
  @ApiOperation({ summary: 'Open a new POS session' })
  @ApiResponse({ status: 201, description: 'Session opened successfully' })
  @ApiResponse({ status: 409, description: 'There is already an open session for this POS' })
  openSession(@Body() dto: OpenPosSessionDto, @Request() req) {
    return this.posSessionService.openSession(dto, req.user.id, req.user.tenant_id);
  }

  @Patch(':id/close')
  @RequirePermission('PosSession', 'Update')
  @ApiOperation({ summary: 'Close an open POS session' })
  @ApiResponse({ status: 200, description: 'Session closed successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session is not open' })
  closeSession(
    @Param('id') id: string,
    @Body() dto: ClosePosSessionDto,
    @Request() req,
  ) {
    return this.posSessionService.closeSession(id, dto, req.user.id, req.user.tenant_id);
  }

  @Get()
  @RequirePermission('PosSession', 'Read')
  @ApiOperation({ summary: 'List POS sessions' })
  @ApiResponse({ status: 200, type: PaginatedPosSessionDto })
  findAll(@Query() query: QueryPosSessionDto, @Request() req) {
    return this.posSessionService.findAll(query, req.user.tenant_id);
  }

  @Get('current/:posConfigId')
  @RequirePermission('PosSession', 'Read')
  @ApiOperation({ summary: 'Get current open session for a POS configuration' })
  @ApiResponse({ status: 200, description: 'Current open session' })
  @ApiResponse({ status: 404, description: 'No open session found' })
  getCurrentSession(@Param('posConfigId') posConfigId: string, @Request() req) {
    return this.posSessionService.getCurrentOpenSession(posConfigId, req.user.tenant_id);
  }

  @Get(':id')
  @RequirePermission('PosSession', 'Read')
  @ApiOperation({ summary: 'Get POS session by ID' })
  @ApiResponse({ status: 200, description: 'Session found' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.posSessionService.findOne(id, req.user.tenant_id);
  }
}
