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
    Query,
    Res,
    BadRequestException,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { PermissionService } from '../rbac/services/permission.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { QueryCustomersExportDto } from './dto/query-customers-export.dto';
import {
    CreateCustomerAddressDto,
    UpdateCustomerAddressDto,
} from './dto/customer-address.dto';
import { CustomersExportService } from './services/customers-export.service';
import { CustomerProductInsightsService } from './services/customer-product-insights.service';
import { QueryCustomerProductInsightsDto } from './dto/query-customer-product-insights.dto';
import { CustomerGroupsService } from './customer-groups.service';
import { CheckCustomerDuplicatesDto } from './dto/check-customer-duplicates.dto';
import { UpsertCustomerCreditsDto } from './dto/upsert-customer-credit.dto';
import { UpsertCustomerPriceListsDto } from './dto/upsert-customer-price-lists.dto';
import { CustomerPriceListService } from './services/customer-price-list.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/customers')
@ApiTags('Customers')
@ApiBearerAuth()
export class CustomersController {
    constructor(
        private readonly customersService: CustomersService,
        private readonly exportService: CustomersExportService,
        private readonly productInsightsService: CustomerProductInsightsService,
        private readonly customerGroupsService: CustomerGroupsService,
        private readonly customerPriceListService: CustomerPriceListService,
        private readonly permissionService: PermissionService,
    ) { }

    private async stripInsightWithoutPermission(
        query: QueryCustomersDto | undefined,
        req: any,
    ): Promise<void> {
        if (!query?.insight) {
            return;
        }
        const userId = req.user?.user_id ?? req.user?.id;
        const tenantId = req.user?.tenantId ?? req.user?.tenant_id;
        if (!userId || !tenantId) {
            query.insight = undefined;
            return;
        }
        const allowed = await this.permissionService.hasPermission(
            userId,
            tenantId,
            'customers',
            'ViewStats',
        );
        if (!allowed) {
            query.insight = undefined;
        }
    }

    @Post()
    @RequirePermissions({ entityType: 'customers', action: 'Create' })
    @ApiOperation({ summary: 'Create a new customer' })
    @ApiBody({ type: CreateCustomerDto })
    @ApiResponse({ status: 201, description: 'Customer created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    create(@Body() dto: CreateCustomerDto, @Req() req) {
        return this.customersService.create(
            dto,
            req.user.tenantId,
            req.user.id ?? req.user.user_id,
        );
    }

    @Post('duplicates')
    @RequirePermissions({ entityType: 'customers', action: 'Create' })
    @ApiOperation({
        summary: 'Buscar clientes similares por correo, teléfono, nombre+apellido o RFC',
    })
    @ApiBody({ type: CheckCustomerDuplicatesDto })
    @ApiResponse({ status: 200, description: 'Coincidencias encontradas (puede estar vacío)' })
    checkDuplicates(@Body() dto: CheckCustomerDuplicatesDto, @Req() req) {
        return this.customersService.findDuplicates(dto, req.user.tenantId);
    }

    @Put(':id')
    @RequirePermissions({ entityType: 'customers', action: 'Update' })
    @ApiOperation({ summary: 'Update an existing customer' })
    @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
    @ApiBody({ type: UpdateCustomerDto })
    @ApiResponse({ status: 200, description: 'Customer updated successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Customer does not exist' })
    update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @Req() req) {
        return this.customersService.update(
            Number(id),
            dto,
            req.user.tenantId,
            req.user.id ?? req.user.user_id,
        );
    }

    @Post(':id/fiscal-constancia')
    @RequirePermissions({ entityType: 'customers', action: 'Update' })
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Leer la constancia del SAT (PDF) y guardar los datos fiscales' })
    @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    })
    @ApiResponse({ status: 200, description: 'Datos fiscales actualizados desde la constancia' })
    @ApiResponse({ status: 400, description: 'El PDF no es una constancia legible' })
    applySatConstancia(
        @Param('id') id: string,
        @UploadedFile()
        file: { buffer?: Buffer; mimetype?: string; originalname?: string; size?: number },
        @Req() req,
    ) {
        if (!file) {
            throw new BadRequestException('Sube el PDF de la constancia del SAT.');
        }
        return this.customersService.applySatConstancia(
            Number(id),
            file,
            req.user.tenantId,
            req.user.id ?? req.user.user_id,
        );
    }

    @Get('statuses')
    @RequirePermissions({ entityType: 'customers', action: 'Read' })
    @ApiOperation({ summary: 'Listar estatus disponibles para clientes' })
    @ApiResponse({ status: 200, description: 'Catálogo de estatus obtenido' })
    findAllStatuses() {
        return this.customersService.findAllStatuses();
    }

    @Get('groups')
    @RequirePermissions({ entityType: 'customers', action: 'Read' })
    @ApiOperation({
        summary: 'Catálogo de grupos de clientes de esta organización (filtro y select)',
    })
    @ApiResponse({ status: 200, description: 'Grupos de esta organización' })
    findGroups(@Req() req) {
        return this.customerGroupsService.findOptions(
            req.user.tenant_id ?? req.user.tenantId,
        );
    }

    @Get('registration-options')
    @RequirePermissions({ entityType: 'customers', action: 'Read' })
    @ApiOperation({
        summary: 'Catálogo de razones sociales, sucursales y vendedores para el tab Registro',
    })
    @ApiResponse({ status: 200, description: 'Razones sociales, sucursales y usuarios de esta organización' })
    getRegistrationOptions(@Req() req) {
        return this.customersService.getRegistrationOptions(
            req.user.tenant_id ?? req.user.tenantId,
        );
    }

    @Get('export/excel')
    @RequirePermissions({ entityType: 'customers', action: 'Read' })
    @ApiOperation({ summary: 'Descargar Excel de clientes' })
    @ApiResponse({ status: 200, description: 'Archivo Excel generado' })
    async exportExcel(
        @Query() query: QueryCustomersExportDto,
        @Req() req,
        @Res() res,
    ) {
        await this.stripInsightWithoutPermission(query, req);
        const buffer = await this.exportService.exportCustomers(req.user.tenantId, query);
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${this.exportService.getFilename()}"`,
        );
        res.send(buffer);
    }

    @Get('stats')
    @RequirePermissions({ entityType: 'customers', action: 'ViewStats' })
    @ApiOperation({
        summary: 'Resumen del listado de clientes de esta organización',
        description:
            'Totales de órdenes vigentes, listos para facturar, activos y con correo. Respeta búsqueda, estatus y grupo. No aplica insight.',
    })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'status_id', required: false, type: Number })
    @ApiQuery({ name: 'group_id', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Conteos del directorio' })
    @ApiResponse({ status: 403, description: 'Sin permiso ViewStats' })
    getListStats(@Query() query: QueryCustomersDto, @Req() req) {
        return this.customersService.getListStats(
            req.user.tenantId ?? req.user.tenant_id,
            query,
        );
    }

    @Get()
    @RequirePermissions({ entityType: 'customers', action: 'Read' })
    @ApiOperation({ summary: 'Get paginated customers with search and filters' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)', example: 20 })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name, email, phone, company, RFC, fiscal name, etc.' })
    @ApiQuery({ name: 'status_id', required: false, type: Number, description: 'Filter by status ID' })
    @ApiQuery({ name: 'group_id', required: false, type: String, description: 'Filter by customer group ID' })
    @ApiQuery({
        name: 'insight',
        required: false,
        type: String,
        description: 'Corte del resumen. Se ignora sin el permiso ViewStats.',
    })
    @ApiResponse({ status: 200, description: 'List of customers retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    async findAll(@Query() query: QueryCustomersDto, @Req() req): Promise<any> {
        await this.stripInsightWithoutPermission(query, req);
        return this.customersService.findAll(req.user.tenantId, query);
    }

    @Get(':id/assignment-history')
    @RequirePermissions({ entityType: 'customers', action: 'Read' })
    @ApiOperation({
        summary: 'Historial de asignaciones del cliente',
                        description:
            'Cambios de vendedor asignado, razón y sucursal de registro. Quién, cuándo y de → a. Solo en el cliente, no en la orden de venta. También viene en GET /customers/:id como assignment_history.',
    })
    @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
    getAssignmentHistory(@Param('id') id: string, @Req() req) {
        return this.customersService.getAssignmentHistory(
            Number(id),
            req.user.tenant_id ?? req.user.tenantId,
        );
    }

    @Get(':id/credits')
    @RequirePermissions({ entityType: 'customers', action: 'Read' })
    @ApiOperation({
        summary: 'Crédito del cliente por razón social (no por almacén)',
    })
    @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
    listCredits(@Param('id') id: string, @Req() req) {
        return this.customersService.listCredits(Number(id), req.user.tenantId);
    }

    @Put(':id/credits')
    @RequirePermissions({ entityType: 'customers', action: 'Update' })
    @ApiOperation({
        summary: 'Activar o editar crédito por razón social',
    })
    @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
    @ApiBody({ type: UpsertCustomerCreditsDto })
    upsertCredits(
        @Param('id') id: string,
        @Body() dto: UpsertCustomerCreditsDto,
        @Req() req,
    ) {
        return this.customersService.upsertCredits(Number(id), dto, req.user.tenantId);
    }

    @Get(':id/price-lists')
    @RequirePermissions({ entityType: 'customers', action: 'Read' })
    @ApiOperation({
        summary: 'Listas de precio habilitadas para el cliente',
    })
    @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
    listPriceLists(@Param('id') id: string, @Req() req) {
        return this.customerPriceListService.list(
            Number(id),
            req.user.tenantId ?? req.user.tenant_id,
        );
    }

    @Put(':id/price-lists')
    @RequirePermissions({ entityType: 'customers', action: 'Update' })
    @ApiOperation({
        summary: 'Reemplaza las listas de precio del cliente y marca una como predeterminada',
    })
    @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
    @ApiBody({ type: UpsertCustomerPriceListsDto })
    upsertPriceLists(
        @Param('id') id: string,
        @Body() dto: UpsertCustomerPriceListsDto,
        @Req() req,
    ) {
        return this.customerPriceListService.replace(
            Number(id),
            req.user.tenantId ?? req.user.tenant_id,
            dto.price_lists ?? [],
        );
    }

    @Get(':id')
    @RequirePermissions({ entityType: 'customers', action: 'Read' })
    @ApiOperation({ summary: 'Get a specific customer by ID' })
    @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
    @ApiQuery({
        name: 'fiscal_configuration_id',
        required: false,
        description: 'Razón social de la OV/POS para aplanar el snapshot de crédito',
    })
    @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Customer does not exist' })
    findOne(
        @Param('id') id: string,
        @Query('fiscal_configuration_id') fiscalConfigurationId: string | undefined,
        @Req() req,
    ) {
        return this.customersService.findOne(
            Number(id),
            req.user.tenantId,
            fiscalConfigurationId,
        );
    }

    @Get(':id/sales-stats')
    @RequirePermissions({ entityType: 'customers', action: 'Read' })
    @ApiOperation({ summary: 'Resumen de ventas del cliente' })
    @ApiParam({ name: 'id', type: 'number' })
    salesStats(@Param('id') id: string, @Req() req) {
        return this.customersService.getSalesStats(Number(id), req.user.tenantId);
    }

    @Get(':id/purchase-trend')
    @RequirePermissions({ entityType: 'customers', action: 'Read' })
    @ApiOperation({ summary: 'Compras del cliente en los últimos 12 meses' })
    @ApiParam({ name: 'id', type: 'number' })
    purchaseTrend(@Param('id') id: string, @Req() req) {
        return this.customersService.getPurchaseTrend(
            Number(id),
            req.user.tenant_id ?? req.user.tenantId,
        );
    }

    @Get(':id/product-insights')
    @RequirePermissions({ entityType: 'customers', action: 'ComprasFrecuentes' })
    @ApiOperation({
        summary:
            'Productos más comprados y sugerencias (misma categoría/subcategoría) para el detalle del cliente',
    })
    @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
    getProductInsights(
        @Param('id') id: string,
        @Query() query: QueryCustomerProductInsightsDto,
        @Req() req,
    ) {
        return this.productInsightsService.getInsights(
            Number(id),
            req.user.tenant_id ?? req.user.tenantId,
            query,
        );
    }

    @Delete(':id')
    @RequirePermissions({ entityType: 'customers', action: 'Delete' })
    @ApiOperation({ summary: 'Delete a customer by ID' })
    @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
    @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Customer does not exist' })
    remove(@Param('id') id: string, @Req() req) {
        throw new Error('Delete functionality not yet implemented in service');
    }

    @Get(':id/addresses')
    @RequirePermissions({ entityType: 'customers', action: 'Read' })
    @ApiOperation({ summary: 'Get all addresses for a customer' })
    @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
    @ApiResponse({ status: 200, description: 'Customer addresses retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Customer does not exist' })
    async getAddresses(@Param('id') id: string, @Req() req) {
        const customer = await this.customersService.findOneWithAddresses(Number(id), req.user.tenantId);
        return customer?.addresses || [];
    }

    @Post(':id/addresses')
    @RequirePermissions({ entityType: 'customers', action: 'Update' })
    @ApiOperation({ summary: 'Crear dirección de cliente (con o sin GPS)' })
    async createAddress(
        @Param('id') id: string,
        @Body() dto: CreateCustomerAddressDto,
        @Req() req,
    ) {
        return this.customersService.createAddress(
            Number(id),
            dto,
            req.user.tenant_id ?? req.user.tenantId,
        );
    }

    @Put(':id/addresses/:addressId')
    @RequirePermissions({ entityType: 'customers', action: 'Update' })
    @ApiOperation({ summary: 'Actualizar dirección de cliente (recalcula has_gps)' })
    async updateAddress(
        @Param('id') id: string,
        @Param('addressId') addressId: string,
        @Body() dto: UpdateCustomerAddressDto,
        @Req() req,
    ) {
        return this.customersService.updateAddress(
            Number(id),
            Number(addressId),
            dto,
            req.user.tenant_id ?? req.user.tenantId,
        );
    }

    @Get(':id/activities')
    @RequirePermissions({ entityType: 'customers', action: 'Read' })
    @ApiOperation({ summary: 'Get all activities for a customer' })
    @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
    @ApiResponse({ status: 200, description: 'Customer activities retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Customer does not exist' })
    async getActivities(@Param('id') id: string, @Req() req) {
        const customer = await this.customersService.findOneWithActivities(Number(id), req.user.tenantId);
        return customer?.activities || [];
    }
}
