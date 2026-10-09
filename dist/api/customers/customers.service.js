"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_status_entity_1 = require("../../entities/customers/customer-status.entity");
const customer_entity_1 = require("../../entities/customers/customer.entity");
const customer_address_entity_1 = require("../../entities/customers/customer-address.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const fiscal_configuration_entity_1 = require("../../entities/billing/fiscal-configuration.entity");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const phone_validator_1 = require("../../common/utils/phone.validator");
const geo_helper_1 = require("../../common/utils/geo.helper");
const customer_groups_service_1 = require("./customer-groups.service");
const fiscal_domicile_util_1 = require("./utils/fiscal-domicile.util");
const customer_credit_service_1 = require("./services/customer-credit.service");
const customer_assignment_service_1 = require("./services/customer-assignment.service");
const fiscal_invoice_readiness_util_1 = require("./utils/fiscal-invoice-readiness.util");
const map_customer_checkout_util_1 = require("./utils/map-customer-checkout.util");
const customer_credit_util_1 = require("./utils/customer-credit.util");
const customer_purchase_trend_util_1 = require("./utils/customer-purchase-trend.util");
const assignment_change_util_1 = require("../../common/utils/assignment-change.util");
const sat_csf_pdf_util_1 = require("./utils/sat-csf-pdf.util");
const sat_csf_util_1 = require("./utils/sat-csf.util");
const customer_list_insight_util_1 = require("./utils/customer-list-insight.util");
const GENERIC_RFCS = new Set(['XAXX010101000', 'XEXX010101000']);
const DUPLICATE_MATCH_LIMIT = 10;
let CustomersService = class CustomersService {
    customerRepo;
    statusRepo;
    warehouseRepo;
    billingBranchRepo;
    fiscalConfigRepo;
    userRepo;
    addressRepo;
    salesOrderRepo;
    customerGroupsService;
    customerCreditService;
    customerAssignmentService;
    constructor(customerRepo, statusRepo, warehouseRepo, billingBranchRepo, fiscalConfigRepo, userRepo, addressRepo, salesOrderRepo, customerGroupsService, customerCreditService, customerAssignmentService) {
        this.customerRepo = customerRepo;
        this.statusRepo = statusRepo;
        this.warehouseRepo = warehouseRepo;
        this.billingBranchRepo = billingBranchRepo;
        this.fiscalConfigRepo = fiscalConfigRepo;
        this.userRepo = userRepo;
        this.addressRepo = addressRepo;
        this.salesOrderRepo = salesOrderRepo;
        this.customerGroupsService = customerGroupsService;
        this.customerCreditService = customerCreditService;
        this.customerAssignmentService = customerAssignmentService;
    }
    async resolveDefaultStatus() {
        const active = await this.statusRepo.findOne({
            where: { code: 'ACTIVE' },
        });
        if (active)
            return active;
        return this.statusRepo.findOneByOrFail({ id: 1 });
    }
    async findAllStatuses() {
        return this.statusRepo.find({ order: { id: 'ASC' } });
    }
    async create(dto, tenantId, currentUserId) {
        const status = dto.status_id
            ? await this.statusRepo.findOneByOrFail({ id: dto.status_id })
            : await this.resolveDefaultStatus();
        let phone = dto.phone;
        let phoneCode = dto.phone_code;
        if (phone) {
            const result = (0, phone_validator_1.parsePhoneNumber)(phone);
            if (result.isValid) {
                phone = result.nationalNumber;
                phoneCode = result.countryCode;
            }
        }
        let additionalPhone = dto.additional_phone;
        let additionalPhoneCode = dto.additional_phone_code;
        if (additionalPhone) {
            const defaultForParse = additionalPhoneCode ?? phoneCode;
            const parsed = (0, phone_validator_1.parsePhoneNumber)(additionalPhone, defaultForParse);
            if (parsed.isValid) {
                additionalPhone = parsed.nationalNumber;
                additionalPhoneCode = parsed.countryCode;
            }
        }
        const warehouse = dto.warehouse_id !== undefined ? await this.resolveWarehouseOrThrow(dto.warehouse_id, tenantId) : undefined;
        const groupId = await this.customerGroupsService.assertBelongsToOrganization(dto.group_id, tenantId);
        const registration = await this.resolveRegistrationAssignment(dto, tenantId);
        const assignedSellerUserId = await this.resolveAssignedSellerOrThrow(dto.assigned_seller_user_id, tenantId);
        const registeredByUserId = await this.resolveRegisteredByUserOrThrow(dto.registered_by_user_id !== undefined ? dto.registered_by_user_id : currentUserId, tenantId);
        delete dto.registered_fiscal_configuration_id;
        delete dto.registered_billing_branch_id;
        delete dto.assigned_seller_user_id;
        this.applySatFiscalDomicilio(dto);
        const creditPatch = this.extractCreditPatch(dto);
        this.stripLegacyCreditFields(dto);
        const saved = await this.customerRepo.save({
            ...dto,
            group_id: groupId,
            phone,
            phone_code: phoneCode,
            additional_phone: additionalPhone,
            additional_phone_code: additionalPhoneCode,
            warehouse,
            registered_fiscal_configuration_id: registration.fiscalId,
            registered_billing_branch_id: registration.branchId,
            assigned_seller_user_id: assignedSellerUserId ?? null,
            registered_by_user_id: registeredByUserId ?? null,
            tenant_id: tenantId,
            status,
            ...(creditPatch
                ? {
                    credit_enabled: creditPatch.credit_enabled,
                    credit_days: creditPatch.credit_days,
                    credit_amount: creditPatch.credit_amount,
                }
                : {}),
        });
        if (creditPatch) {
            await this.customerCreditService.upsertForAllActiveFiscales(saved, creditPatch);
        }
        const initialChanges = await this.buildAssignmentChanges(tenantId, { fiscalId: null, branchId: null, sellerId: null }, {
            fiscalId: saved.registered_fiscal_configuration_id,
            branchId: saved.registered_billing_branch_id,
            sellerId: saved.assigned_seller_user_id,
        });
        await this.customerAssignmentService.record({
            tenantId,
            customerId: saved.id,
            actorId: currentUserId ?? null,
            type: 'assignment_initialized',
            changes: initialChanges,
        });
        return saved;
    }
    async update(id, dto, tenantId, currentUserId) {
        const customer = await this.customerRepo.findOneOrFail({
            where: { id, tenant_id: tenantId },
            relations: ['registered_fiscal_configuration', 'registered_billing_branch', 'assigned_seller_user'],
        });
        const previousAssignment = {
            fiscalId: customer.registered_fiscal_configuration_id,
            branchId: customer.registered_billing_branch_id,
            sellerId: customer.assigned_seller_user_id,
        };
        if (dto.status_id) {
            const status = await this.statusRepo.findOneByOrFail({
                id: dto.status_id,
            });
            customer.status = status;
        }
        if (dto.phone) {
            const result = (0, phone_validator_1.parsePhoneNumber)(dto.phone);
            if (result.isValid) {
                dto.phone = result.nationalNumber;
                dto.phone_code = result.countryCode;
            }
        }
        if (dto.additional_phone) {
            const defaultCode = dto.additional_phone_code ?? customer.additional_phone_code ?? dto.phone_code ?? customer.phone_code;
            const parsed = (0, phone_validator_1.parsePhoneNumber)(dto.additional_phone, defaultCode);
            if (parsed.isValid) {
                dto.additional_phone = parsed.nationalNumber;
                dto.additional_phone_code = parsed.countryCode;
            }
        }
        if (dto.warehouse_id !== undefined) {
            customer.warehouse = await this.resolveWarehouseOrThrow(dto.warehouse_id, tenantId);
        }
        if (dto.group_id !== undefined) {
            customer.group_id = await this.customerGroupsService.assertBelongsToOrganization(dto.group_id, tenantId);
            delete dto.group_id;
        }
        if (dto.registered_fiscal_configuration_id !== undefined || dto.registered_billing_branch_id !== undefined) {
            const registration = await this.resolveRegistrationAssignment(dto, tenantId, customer);
            customer.registered_fiscal_configuration_id = registration.fiscalId;
            customer.registered_billing_branch_id = registration.branchId;
            delete dto.registered_fiscal_configuration_id;
            delete dto.registered_billing_branch_id;
        }
        if (dto.assigned_seller_user_id !== undefined) {
            customer.assigned_seller_user_id =
                (await this.resolveAssignedSellerOrThrow(dto.assigned_seller_user_id, tenantId)) ?? null;
            delete dto.assigned_seller_user_id;
        }
        if (dto.registered_by_user_id !== undefined) {
            customer.registered_by_user_id =
                (await this.resolveRegisteredByUserOrThrow(dto.registered_by_user_id, tenantId)) ?? null;
            delete dto.registered_by_user_id;
        }
        this.applySatFiscalDomicilio(dto, customer);
        const creditPatch = this.extractCreditPatch(dto);
        this.stripLegacyCreditFields(dto);
        if (creditPatch) {
            this.applyCreditPatchToCustomer(customer, creditPatch);
        }
        Object.assign(customer, dto);
        const saved = await this.customerRepo.save(customer);
        if (creditPatch) {
            await this.customerCreditService.upsertForAllActiveFiscales(saved, creditPatch);
        }
        const assignmentChanges = await this.buildAssignmentChanges(tenantId, previousAssignment, {
            fiscalId: saved.registered_fiscal_configuration_id,
            branchId: saved.registered_billing_branch_id,
            sellerId: saved.assigned_seller_user_id,
        });
        await this.customerAssignmentService.record({
            tenantId,
            customerId: saved.id,
            actorId: currentUserId ?? null,
            type: 'assignment_updated',
            changes: assignmentChanges,
        });
        const enriched = await this.findOne(saved.id, tenantId);
        if (!enriched) {
            throw new common_1.NotFoundException('Cliente no encontrado');
        }
        return enriched;
    }
    async applySatConstancia(id, file, tenantId, currentUserId) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('Sube el PDF de la constancia del SAT.');
        }
        if ((file.size ?? file.buffer.length) > 10 * 1024 * 1024) {
            throw new common_1.BadRequestException('El PDF no puede superar 10 MB.');
        }
        const name = (file.originalname ?? '').toLowerCase();
        const mime = (file.mimetype ?? '').toLowerCase();
        const header = file.buffer.subarray(0, 5).toString('utf8');
        if (header !== '%PDF-' || (mime !== 'application/pdf' && !name.endsWith('.pdf'))) {
            throw new common_1.BadRequestException('Sube el PDF de la constancia del SAT.');
        }
        try {
            const items = await (0, sat_csf_pdf_util_1.extractSatCsfTextItems)(file.buffer);
            const parsed = (0, sat_csf_util_1.parseSatCsfTextItems)(items);
            return await this.update(id, toSatConstanciaUpdate(parsed), tenantId, currentUserId);
        }
        catch (error) {
            if (error instanceof sat_csf_util_1.SatCsfParseError) {
                throw new common_1.BadRequestException(error.message);
            }
            throw error;
        }
    }
    async findAll(tenantId, query) {
        let page = Number(query?.page) || 1;
        let limit = Number(query?.limit) || 20;
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 1;
        if (limit > 100)
            limit = 100;
        const skip = (page - 1) * limit;
        const queryBuilder = this.customerRepo
            .createQueryBuilder('customer')
            .leftJoinAndSelect('customer.status', 'status')
            .leftJoinAndSelect('customer.group', 'group', 'group.tenant_id = customer.tenant_id')
            .leftJoinAndSelect('customer.warehouse', 'warehouse')
            .leftJoinAndSelect('customer.registered_billing_branch', 'registeredBranch')
            .leftJoin('customer.registered_fiscal_configuration', 'registeredFiscal')
            .addSelect(['registeredFiscal.id', 'registeredFiscal.razon_social', 'registeredFiscal.rfc'])
            .leftJoin('customer.registered_by_user', 'registeredByUser')
            .addSelect([
            'registeredByUser.id',
            'registeredByUser.first_name',
            'registeredByUser.last_name',
            'registeredByUser.email',
        ])
            .leftJoin('customer.assigned_seller_user', 'assignedSeller')
            .addSelect([
            'assignedSeller.id',
            'assignedSeller.first_name',
            'assignedSeller.last_name',
            'assignedSeller.email',
            'assignedSeller.pos_user_code',
        ])
            .leftJoin('customer.contracts', 'contracts')
            .leftJoin('contracts.property', 'property')
            .addSelect([
            'contracts.id',
            'contracts.status',
            'contracts.contract_number',
            'property.id',
            'property.code',
            'property.name',
            'property.status',
        ])
            .where('customer.tenant_id = :tenantId', { tenantId });
        (0, customer_list_insight_util_1.applyCustomerDirectoryFilters)(queryBuilder, query);
        queryBuilder.orderBy('customer.created_at', 'DESC');
        const total = await queryBuilder.getCount();
        const customers = await queryBuilder.skip(skip).take(limit).getMany();
        const totalPages = Math.ceil(total / limit);
        return {
            data: customers,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }
    async getListStats(tenantId, query) {
        const queryBuilder = this.customerRepo
            .createQueryBuilder('customer')
            .leftJoin('customer.status', 'status')
            .leftJoin('customer.contracts', 'contracts')
            .leftJoin('contracts.property', 'property')
            .where('customer.tenant_id = :tenantId', { tenantId });
        (0, customer_list_insight_util_1.applyCustomerDirectoryFilters)(queryBuilder, query, { applyInsight: false });
        const raw = await queryBuilder
            .select('COUNT(DISTINCT customer.id)', 'total')
            .addSelect(`COUNT(DISTINCT CASE WHEN ${customer_list_insight_util_1.CUSTOMER_HAS_ORDER_SQL} THEN customer.id END)`, 'with_orders')
            .addSelect(`COUNT(DISTINCT CASE WHEN NOT (${customer_list_insight_util_1.CUSTOMER_HAS_ORDER_SQL}) THEN customer.id END)`, 'without_orders')
            .addSelect(`COUNT(DISTINCT CASE WHEN ${customer_list_insight_util_1.CUSTOMER_FISCAL_READY_SQL} THEN customer.id END)`, 'fiscal_ready')
            .addSelect(`COUNT(DISTINCT CASE WHEN NOT (${customer_list_insight_util_1.CUSTOMER_FISCAL_READY_SQL}) THEN customer.id END)`, 'fiscal_not_ready')
            .addSelect(`COUNT(DISTINCT CASE WHEN ${customer_list_insight_util_1.CUSTOMER_IS_ACTIVE_SQL} THEN customer.id END)`, 'active')
            .addSelect(`COUNT(DISTINCT CASE WHEN ${customer_list_insight_util_1.CUSTOMER_IS_INACTIVE_SQL} THEN customer.id END)`, 'inactive')
            .addSelect(`COUNT(DISTINCT CASE WHEN ${customer_list_insight_util_1.CUSTOMER_HAS_EMAIL_SQL} THEN customer.id END)`, 'with_email')
            .addSelect(`COUNT(DISTINCT CASE WHEN NOT (${customer_list_insight_util_1.CUSTOMER_HAS_EMAIL_SQL}) THEN customer.id END)`, 'without_email')
            .getRawOne();
        const count = (key) => {
            const value = Number(raw?.[key] ?? 0);
            return Number.isFinite(value) ? value : 0;
        };
        return {
            total: count('total'),
            with_orders: count('with_orders'),
            without_orders: count('without_orders'),
            fiscal_ready: count('fiscal_ready'),
            fiscal_not_ready: count('fiscal_not_ready'),
            active: count('active'),
            inactive: count('inactive'),
            with_email: count('with_email'),
            without_email: count('without_email'),
        };
    }
    async findOne(id, tenantId, fiscalConfigurationId) {
        const customer = await this.customerRepo
            .createQueryBuilder('customer')
            .leftJoinAndSelect('customer.status', 'status')
            .leftJoinAndSelect('customer.group', 'group', 'group.tenant_id = customer.tenant_id')
            .leftJoinAndSelect('customer.warehouse', 'warehouse')
            .leftJoinAndSelect('customer.registered_billing_branch', 'registeredBranch')
            .leftJoin('customer.registered_fiscal_configuration', 'registeredFiscal')
            .addSelect(['registeredFiscal.id', 'registeredFiscal.razon_social', 'registeredFiscal.rfc'])
            .leftJoin('customer.registered_by_user', 'registeredByUser')
            .addSelect([
            'registeredByUser.id',
            'registeredByUser.first_name',
            'registeredByUser.last_name',
            'registeredByUser.email',
        ])
            .leftJoin('customer.assigned_seller_user', 'assignedSeller')
            .addSelect([
            'assignedSeller.id',
            'assignedSeller.first_name',
            'assignedSeller.last_name',
            'assignedSeller.email',
            'assignedSeller.pos_user_code',
        ])
            .leftJoinAndSelect('customer.contracts', 'contracts')
            .leftJoinAndSelect('contracts.property', 'property')
            .where('customer.id = :id', { id })
            .andWhere('customer.tenant_id = :tenantId', { tenantId })
            .getOne();
        if (!customer) {
            return null;
        }
        return this.enrichCustomer(customer, fiscalConfigurationId);
    }
    async listCredits(id, tenantId) {
        const customer = await this.customerRepo.findOneBy({
            id,
            tenant_id: tenantId,
        });
        if (!customer) {
            throw new common_1.NotFoundException('Cliente no encontrado');
        }
        return this.customerCreditService.listForCustomer(customer);
    }
    async upsertCredits(id, dto, tenantId) {
        const customer = await this.customerRepo.findOneBy({
            id,
            tenant_id: tenantId,
        });
        if (!customer) {
            throw new common_1.NotFoundException('Cliente no encontrado');
        }
        return this.customerCreditService.upsertMany(customer, dto.credits);
    }
    async findOneWithAddresses(id, tenantId) {
        return this.customerRepo
            .createQueryBuilder('customer')
            .leftJoinAndSelect('customer.status', 'status')
            .leftJoinAndSelect('customer.group', 'group', 'group.tenant_id = customer.tenant_id')
            .leftJoinAndSelect('customer.warehouse', 'warehouse')
            .leftJoinAndSelect('customer.registered_billing_branch', 'registeredBranch')
            .leftJoin('customer.registered_fiscal_configuration', 'registeredFiscal')
            .addSelect(['registeredFiscal.id', 'registeredFiscal.razon_social', 'registeredFiscal.rfc'])
            .leftJoin('customer.registered_by_user', 'registeredByUser')
            .addSelect([
            'registeredByUser.id',
            'registeredByUser.first_name',
            'registeredByUser.last_name',
            'registeredByUser.email',
        ])
            .leftJoin('customer.assigned_seller_user', 'assignedSeller')
            .addSelect([
            'assignedSeller.id',
            'assignedSeller.first_name',
            'assignedSeller.last_name',
            'assignedSeller.email',
            'assignedSeller.pos_user_code',
        ])
            .leftJoinAndSelect('customer.addresses', 'addresses')
            .where('customer.id = :id', { id })
            .andWhere('customer.tenant_id = :tenantId', { tenantId })
            .getOne();
    }
    async findOneWithActivities(id, tenantId) {
        return this.customerRepo
            .createQueryBuilder('customer')
            .leftJoinAndSelect('customer.status', 'status')
            .leftJoinAndSelect('customer.group', 'group', 'group.tenant_id = customer.tenant_id')
            .leftJoinAndSelect('customer.warehouse', 'warehouse')
            .leftJoinAndSelect('customer.registered_billing_branch', 'registeredBranch')
            .leftJoin('customer.registered_fiscal_configuration', 'registeredFiscal')
            .addSelect(['registeredFiscal.id', 'registeredFiscal.razon_social', 'registeredFiscal.rfc'])
            .leftJoin('customer.registered_by_user', 'registeredByUser')
            .addSelect([
            'registeredByUser.id',
            'registeredByUser.first_name',
            'registeredByUser.last_name',
            'registeredByUser.email',
        ])
            .leftJoin('customer.assigned_seller_user', 'assignedSeller')
            .addSelect([
            'assignedSeller.id',
            'assignedSeller.first_name',
            'assignedSeller.last_name',
            'assignedSeller.email',
            'assignedSeller.pos_user_code',
        ])
            .leftJoinAndSelect('customer.activities', 'activities')
            .where('customer.id = :id', { id })
            .andWhere('customer.tenant_id = :tenantId', { tenantId })
            .getOne();
    }
    async createAddress(customerId, dto, tenantId) {
        const customer = await this.customerRepo.findOne({
            where: { id: customerId, tenant_id: tenantId },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Cliente no encontrado');
        }
        const lat = dto.latitude ?? null;
        const lng = dto.longitude ?? null;
        const gpsOk = (0, geo_helper_1.hasValidGps)({ latitude: lat, longitude: lng });
        const address = this.addressRepo.create({
            ...dto,
            customer_id: customerId,
            tenant_id: tenantId,
            latitude: lat,
            longitude: lng,
            has_gps: gpsOk ? 1 : 0,
            address_source: dto.address_source || (gpsOk ? 'manual' : 'without_location'),
            status: 1,
            is_primary: dto.is_primary ?? false,
        });
        return this.addressRepo.save(address);
    }
    async updateAddress(customerId, addressId, dto, tenantId) {
        const address = await this.addressRepo.findOne({
            where: {
                id: addressId,
                customer_id: customerId,
                tenant_id: tenantId,
            },
        });
        if (!address) {
            throw new common_1.NotFoundException('Dirección no encontrada');
        }
        Object.assign(address, dto);
        const gpsOk = (0, geo_helper_1.hasValidGps)(address);
        address.has_gps = gpsOk ? 1 : 0;
        if (dto.latitude !== undefined || dto.longitude !== undefined) {
            address.address_source = dto.address_source || (gpsOk ? 'manual' : 'without_location');
        }
        return this.addressRepo.save(address);
    }
    async resolveWarehouseOrThrow(warehouseId, tenantId) {
        if (warehouseId === null || warehouseId === '') {
            return null;
        }
        const warehouse = await this.warehouseRepo.findOne({
            where: {
                id: warehouseId,
                tenant_id: tenantId,
            },
        });
        if (!warehouse) {
            throw new common_1.BadRequestException('warehouse_id no es válido para esta organización');
        }
        return warehouse;
    }
    async getRegistrationOptions(tenantId) {
        const [fiscales, users, sellers] = await Promise.all([
            this.fiscalConfigRepo.find({
                where: { tenant_id: tenantId },
                relations: ['branches'],
                order: { razon_social: 'ASC' },
            }),
            this.userRepo.find({
                where: { tenant_id: tenantId },
                select: ['id', 'first_name', 'last_name', 'email'],
                order: { first_name: 'ASC', last_name: 'ASC' },
            }),
            this.userRepo.find({
                where: { tenant_id: tenantId, pos_user_code: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) },
                select: ['id', 'first_name', 'last_name', 'email', 'pos_user_code'],
                order: { first_name: 'ASC', last_name: 'ASC' },
            }),
        ]);
        const fiscalConfigurations = fiscales.map((fiscal) => ({
            id: fiscal.id,
            razon_social: fiscal.razon_social,
            rfc: fiscal.rfc,
            status: fiscal.status,
            branches: [...(fiscal.branches ?? [])]
                .sort((a, b) => a.code.localeCompare(b.code, 'es'))
                .map((branch) => ({
                id: branch.id,
                name: branch.code,
            })),
        }));
        return {
            fiscal_configurations: fiscalConfigurations,
            users: users.map((user) => ({
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
            })),
            sellers: sellers.map((user) => ({
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                pos_user_code: user.pos_user_code,
            })),
        };
    }
    async getAssignmentHistory(id, tenantId) {
        const data = await this.customerAssignmentService.listForCustomer(id, tenantId);
        return { data, total: data.length };
    }
    async findDuplicates(dto, tenantId) {
        const email = this.normalizeEmail(dto.email);
        const phone = this.normalizePhone(dto.phone, dto.phone_code);
        const name = this.normalizePersonName(dto.name);
        const lastname = this.normalizePersonName(dto.lastname);
        const rfc = this.normalizeRfc(dto.fiscal_rfc);
        const orConditions = [];
        const params = { tenantId };
        if (email) {
            orConditions.push('LOWER(TRIM(customer.email)) = :email');
            params.email = email;
        }
        if (phone) {
            orConditions.push(`REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(customer.phone, ''), ' ', ''), '-', ''), '(', ''), ')', '') = :phone`);
            params.phone = phone;
        }
        if (name && lastname) {
            orConditions.push('LOWER(TRIM(customer.name)) = :name AND LOWER(TRIM(customer.lastname)) = :lastname');
            params.name = name;
            params.lastname = lastname;
        }
        if (rfc && !GENERIC_RFCS.has(rfc)) {
            orConditions.push(`REPLACE(REPLACE(UPPER(TRIM(COALESCE(customer.fiscal_rfc, ''))), '-', ''), ' ', '') = :rfc`);
            params.rfc = rfc;
        }
        if (orConditions.length === 0) {
            return { found: false, matches: [] };
        }
        const customers = await this.customerRepo
            .createQueryBuilder('customer')
            .leftJoinAndSelect('customer.status', 'status')
            .where('customer.tenant_id = :tenantId', { tenantId })
            .andWhere(`(${orConditions.join(' OR ')})`, params)
            .orderBy('customer.created_at', 'DESC')
            .take(DUPLICATE_MATCH_LIMIT)
            .getMany();
        const matches = customers.map((customer) => ({
            id: customer.id,
            name: customer.name,
            lastname: customer.lastname ?? null,
            email: customer.email ?? null,
            phone: customer.phone ?? null,
            phone_code: customer.phone_code ?? null,
            fiscal_rfc: customer.fiscal_rfc ?? null,
            company_name: customer.company_name ?? null,
            status: customer.status ?? null,
            match_reasons: this.resolveMatchReasons(customer, {
                email,
                phone,
                name,
                lastname,
                rfc,
            }),
        }));
        return {
            found: matches.length > 0,
            matches,
        };
    }
    resolveMatchReasons(customer, input) {
        const reasons = [];
        if (input.email && this.normalizeEmail(customer.email) === input.email) {
            reasons.push('email');
        }
        if (input.phone && this.normalizePhone(customer.phone) === input.phone) {
            reasons.push('phone');
        }
        if (input.name &&
            input.lastname &&
            this.normalizePersonName(customer.name) === input.name &&
            this.normalizePersonName(customer.lastname) === input.lastname) {
            reasons.push('name');
        }
        if (input.rfc && !GENERIC_RFCS.has(input.rfc) && this.normalizeRfc(customer.fiscal_rfc) === input.rfc) {
            reasons.push('rfc');
        }
        return reasons;
    }
    normalizeEmail(value) {
        const email = value?.trim().toLowerCase();
        return email || null;
    }
    normalizePersonName(value) {
        const name = value?.trim().toLowerCase().replace(/\s+/g, ' ');
        return name || null;
    }
    normalizeRfc(value) {
        const rfc = value?.trim().toUpperCase().replace(/[\s-]/g, '');
        return rfc || null;
    }
    normalizePhone(phone, phoneCode) {
        if (!phone?.trim()) {
            return null;
        }
        const parsed = (0, phone_validator_1.parsePhoneNumber)(phone, phoneCode ?? undefined);
        if (parsed.isValid) {
            return parsed.nationalNumber.replace(/\D/g, '');
        }
        const digits = phone.replace(/\D/g, '');
        return digits || null;
    }
    async resolveRegisteredBranchOrThrow(branchId, tenantId) {
        if (branchId === undefined) {
            return undefined;
        }
        if (branchId === null || branchId === '') {
            return null;
        }
        const branch = await this.billingBranchRepo
            .createQueryBuilder('branch')
            .innerJoin('branch.fiscal_configuration', 'fc')
            .where('branch.id = :branchId', { branchId })
            .andWhere('fc.tenant_id = :tenantId', { tenantId })
            .getOne();
        if (!branch) {
            throw new common_1.BadRequestException('La sucursal de registro no es válida para esta organización');
        }
        return branch.id;
    }
    async resolveRegisteredByUserOrThrow(userId, tenantId) {
        if (userId === undefined) {
            return undefined;
        }
        if (userId === null || userId === '') {
            return null;
        }
        const user = await this.userRepo.findOne({
            where: { id: userId, tenant_id: tenantId },
            select: ['id'],
        });
        if (!user) {
            throw new common_1.BadRequestException('El usuario que registra no es válido para esta organización');
        }
        return user.id;
    }
    async resolveRegisteredFiscalOrThrow(fiscalId, tenantId) {
        if (fiscalId === undefined) {
            return undefined;
        }
        if (fiscalId === null || fiscalId === '') {
            return null;
        }
        const fiscal = await this.fiscalConfigRepo.findOne({
            where: { id: fiscalId, tenant_id: tenantId },
            select: ['id'],
        });
        if (!fiscal) {
            throw new common_1.BadRequestException('La razón social de registro no es válida para esta organización');
        }
        return fiscal.id;
    }
    async resolveAssignedSellerOrThrow(userId, tenantId) {
        if (userId === undefined) {
            return undefined;
        }
        if (userId === null || userId === '') {
            return null;
        }
        const user = await this.userRepo.findOne({
            where: { id: userId, tenant_id: tenantId },
            select: ['id', 'pos_user_code'],
        });
        if (!user) {
            throw new common_1.BadRequestException('El vendedor asignado no es válido para esta organización');
        }
        if (user.pos_user_code == null) {
            throw new common_1.BadRequestException('El vendedor asignado debe tener un código POS');
        }
        return user.id;
    }
    async resolveRegistrationAssignment(dto, tenantId, existing) {
        const fiscalTouched = dto.registered_fiscal_configuration_id !== undefined;
        const branchTouched = dto.registered_billing_branch_id !== undefined;
        let fiscalId = fiscalTouched
            ? await this.resolveRegisteredFiscalOrThrow(dto.registered_fiscal_configuration_id, tenantId)
            : (existing?.registered_fiscal_configuration_id ?? null);
        let branchId = branchTouched
            ? await this.resolveRegisteredBranchOrThrow(dto.registered_billing_branch_id, tenantId)
            : (existing?.registered_billing_branch_id ?? null);
        fiscalId = fiscalId ?? null;
        branchId = branchId ?? null;
        if (branchId) {
            const branch = await this.billingBranchRepo
                .createQueryBuilder('branch')
                .innerJoin('branch.fiscal_configuration', 'fc')
                .addSelect(['branch.id', 'branch.fiscal_configuration_id'])
                .where('branch.id = :branchId', { branchId })
                .andWhere('fc.tenant_id = :tenantId', { tenantId })
                .getOne();
            if (!branch) {
                throw new common_1.BadRequestException('La sucursal de registro no es válida para esta organización');
            }
            if (fiscalId && branch.fiscal_configuration_id !== fiscalId) {
                if (fiscalTouched && !branchTouched) {
                    branchId = null;
                }
                else {
                    throw new common_1.BadRequestException('La sucursal de registro no pertenece a la razón social seleccionada');
                }
            }
            if (!fiscalId) {
                fiscalId = branch.fiscal_configuration_id;
            }
        }
        return { fiscalId, branchId };
    }
    async buildAssignmentChanges(tenantId, previous, next) {
        const [previousLabels, nextLabels] = await Promise.all([
            this.loadAssignmentLabels(tenantId, previous),
            this.loadAssignmentLabels(tenantId, next),
        ]);
        return (0, assignment_change_util_1.compactAssignmentChanges)([
            (0, assignment_change_util_1.assignmentChange)('registered_fiscal_configuration_id', 'Razón social de registro', previousLabels.fiscalLabel, nextLabels.fiscalLabel, previous.fiscalId, next.fiscalId),
            (0, assignment_change_util_1.assignmentChange)('registered_billing_branch_id', 'Sucursal de registro', previousLabels.branchLabel, nextLabels.branchLabel, previous.branchId, next.branchId),
            (0, assignment_change_util_1.assignmentChange)('assigned_seller_user_id', 'Vendedor asignado', previousLabels.sellerLabel, nextLabels.sellerLabel, previous.sellerId, next.sellerId),
        ]);
    }
    async loadAssignmentLabels(tenantId, ids) {
        const [fiscal, branch, seller] = await Promise.all([
            ids.fiscalId
                ? this.fiscalConfigRepo.findOne({
                    where: { id: ids.fiscalId, tenant_id: tenantId },
                    select: ['id', 'razon_social'],
                })
                : Promise.resolve(null),
            ids.branchId
                ? this.billingBranchRepo.findOne({
                    where: { id: ids.branchId },
                    select: ['id', 'code'],
                })
                : Promise.resolve(null),
            ids.sellerId
                ? this.userRepo.findOne({
                    where: { id: ids.sellerId, tenant_id: tenantId },
                    select: ['id', 'first_name', 'last_name', 'email', 'pos_user_code'],
                })
                : Promise.resolve(null),
        ]);
        return {
            fiscalLabel: fiscal?.razon_social ?? null,
            branchLabel: branch?.code ?? null,
            sellerLabel: (0, assignment_change_util_1.formatAssignmentUserLabel)(seller),
        };
    }
    applySatFiscalDomicilio(dto, existing) {
        if (dto.fiscal_municipio !== undefined && dto.fiscal_city === undefined) {
            dto.fiscal_city = dto.fiscal_municipio;
        }
        const hasFiscalDomicile = (0, fiscal_domicile_util_1.hasSatStreetParts)(dto) ||
            dto.fiscal_municipio !== undefined ||
            dto.fiscal_localidad !== undefined ||
            dto.fiscal_postal_code !== undefined ||
            dto.fiscal_state !== undefined;
        if (hasFiscalDomicile && dto.fiscal_country === undefined && !existing?.fiscal_country) {
            dto.fiscal_country = 'MEX';
        }
        if (dto.fiscal_address !== undefined || !(0, fiscal_domicile_util_1.hasSatStreetParts)(dto)) {
            return;
        }
        const composed = (0, fiscal_domicile_util_1.composeFiscalAddress)({
            street: (0, fiscal_domicile_util_1.pickFiscalPart)(dto.fiscal_street, existing?.fiscal_street),
            exteriorNumber: (0, fiscal_domicile_util_1.pickFiscalPart)(dto.fiscal_exterior_number, existing?.fiscal_exterior_number),
            interiorNumber: (0, fiscal_domicile_util_1.pickFiscalPart)(dto.fiscal_interior_number, existing?.fiscal_interior_number),
            colonia: (0, fiscal_domicile_util_1.pickFiscalPart)(dto.fiscal_colonia, existing?.fiscal_colonia),
        });
        if (composed) {
            dto.fiscal_address = composed;
        }
    }
    extractCreditPatch(dto) {
        return (0, customer_credit_util_1.extractCreditPatchFromBody)(dto);
    }
    applyCreditPatchToCustomer(customer, patch) {
        customer.credit_enabled = patch.credit_enabled;
        customer.credit_days = patch.credit_days ?? null;
        customer.credit_amount = patch.credit_amount ?? null;
    }
    stripLegacyCreditFields(dto) {
        delete dto.credit_enabled;
        delete dto.credit_days;
        delete dto.credit_amount;
    }
    async enrichCustomer(customer, fiscalConfigurationId) {
        const credits = await this.customerCreditService.listForCustomer(customer);
        const fiscal = (0, fiscal_invoice_readiness_util_1.getFiscalInvoiceReadiness)(customer);
        const activeCredit = fiscalConfigurationId
            ? await this.customerCreditService.getSnapshotForFiscal(customer, fiscalConfigurationId)
            : (credits.find((item) => item.credit_enabled) ?? (0, customer_credit_util_1.buildCreditSnapshot)({ creditEnabled: false }));
        const mapped = (0, map_customer_checkout_util_1.mapCustomerCheckoutFields)(customer, credits, fiscal, activeCredit);
        const assignment_history = await this.customerAssignmentService.listForExistingCustomer(customer.id, customer.tenant_id);
        const rest = { ...customer };
        delete rest.credit_enabled;
        delete rest.credit_days;
        delete rest.credit_amount;
        return {
            ...rest,
            ...mapped,
            assignment_history,
        };
    }
    async getSalesStats(customerId, tenantId) {
        const customer = await this.customerRepo.findOne({
            where: { id: customerId, tenant_id: tenantId },
            select: ['id'],
        });
        if (!customer) {
            throw new common_1.NotFoundException('Cliente no encontrado');
        }
        const active = `so.general_status <> 'Cancelada'`;
        const invoiced = `EXISTS (
            SELECT 1 FROM electronic_invoices ei
            WHERE ei.tenant_id = so.tenant_id
              AND ei.source_module = 'sales_orders'
              AND ei.source_id = so.id
              AND ei.stamp_status IN ('stamped', 'cancel_pending', 'cancel_error')
              AND (ei.sat_status IS NULL OR ei.sat_status <> 'Cancelado')
        )`;
        const balanceDue = `GREATEST(
            so.total - COALESCE((
                SELECT SUM(p.amount)
                FROM inv_s_sales_order_payments p
                WHERE p.sales_order_id = so.id AND p.tenant_id = so.tenant_id
            ), 0),
            0
        )`;
        const row = await this.salesOrderRepo
            .createQueryBuilder('so')
            .select('COUNT(so.id)', 'orders_count')
            .addSelect(`COALESCE(SUM(CASE WHEN ${active} THEN 1 ELSE 0 END), 0)`, 'active_orders_count')
            .addSelect(`COALESCE(SUM(CASE WHEN so.general_status = 'Cancelada' THEN 1 ELSE 0 END), 0)`, 'cancelled_count')
            .addSelect(`COALESCE(SUM(CASE WHEN ${active} THEN so.total ELSE 0 END), 0)`, 'sales_total')
            .addSelect(`MAX(CASE WHEN ${active} THEN so.created_at END)`, 'last_order_at')
            .addSelect(`COALESCE(SUM(CASE WHEN ${active} AND ${invoiced} THEN 1 ELSE 0 END), 0)`, 'invoiced_count')
            .addSelect(`COALESCE(SUM(CASE WHEN ${active} AND so.payment_status = 'Pagado' THEN 1 ELSE 0 END), 0)`, 'paid_count')
            .addSelect(`COALESCE(SUM(CASE WHEN ${active} AND so.payment_status = 'Pagado' THEN so.total ELSE 0 END), 0)`, 'paid_total')
            .addSelect(`COALESCE(SUM(CASE WHEN ${active} AND so.payment_status = 'Pendiente' THEN 1 ELSE 0 END), 0)`, 'pending_count')
            .addSelect(`COALESCE(SUM(CASE WHEN ${active} AND so.payment_status = 'Pendiente' THEN ${balanceDue} ELSE 0 END), 0)`, 'pending_total')
            .where('so.customer_id = :customerId', { customerId })
            .andWhere('so.tenant_id = :tenantId', { tenantId })
            .getRawOne();
        const lastOrder = await this.salesOrderRepo.findOne({
            where: {
                customer_id: customerId,
                tenant_id: tenantId,
                general_status: (0, typeorm_2.Not)('Cancelada'),
            },
            select: ['folio', 'created_at'],
            order: { created_at: 'DESC' },
        });
        const money = (value) => Number(Number(value ?? 0).toFixed(2));
        const count = (value) => Number(value ?? 0);
        const activeOrders = count(row?.active_orders_count);
        const salesTotal = money(row?.sales_total);
        return {
            orders_count: count(row?.orders_count),
            active_orders_count: activeOrders,
            cancelled_count: count(row?.cancelled_count),
            sales_total: salesTotal,
            paid_total: money(row?.paid_total),
            paid_count: count(row?.paid_count),
            pending_total: money(row?.pending_total),
            pending_count: count(row?.pending_count),
            invoiced_count: count(row?.invoiced_count),
            average_order: activeOrders > 0 ? Number((salesTotal / activeOrders).toFixed(2)) : 0,
            last_order_at: lastOrder?.created_at ?? row?.last_order_at ?? null,
            last_order_folio: lastOrder?.folio ?? null,
        };
    }
    async getPurchaseTrend(customerId, tenantId) {
        const customer = await this.customerRepo.findOne({
            where: { id: customerId, tenant_id: tenantId },
            select: ['id'],
        });
        if (!customer) {
            throw new common_1.NotFoundException('Cliente no encontrado');
        }
        const from = (0, customer_purchase_trend_util_1.formatUtcDateTime)(new Date((0, customer_purchase_trend_util_1.rollingWindowStart)().getTime() - 24 * 60 * 60 * 1000));
        const rows = await this.salesOrderRepo
            .createQueryBuilder('so')
            .select('so.created_at', 'created_at')
            .addSelect('so.total', 'total')
            .where('so.customer_id = :customerId', { customerId })
            .andWhere('so.tenant_id = :tenantId', { tenantId })
            .andWhere(`so.general_status <> 'Cancelada'`)
            .andWhere('so.created_at >= :from', { from })
            .getRawMany();
        return {
            currency: 'MXN',
            ...(0, customer_purchase_trend_util_1.buildPurchaseTrend)(rows),
        };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_status_entity_1.CustomerStatus)),
    __param(2, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __param(3, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(4, (0, typeorm_1.InjectRepository)(fiscal_configuration_entity_1.FiscalConfiguration)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(6, (0, typeorm_1.InjectRepository)(customer_address_entity_1.CustomerAddress)),
    __param(7, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        customer_groups_service_1.CustomerGroupsService,
        customer_credit_service_1.CustomerCreditService,
        customer_assignment_service_1.CustomerAssignmentService])
], CustomersService);
function toSatConstanciaUpdate(data) {
    const dto = {
        fiscal_rfc: data.fiscal_rfc,
        fiscal_person_type: data.fiscal_person_type,
        fiscal_razon_social: data.fiscal_razon_social,
        fiscal_postal_code: data.fiscal_postal_code,
        fiscal_country: data.fiscal_country,
    };
    const optional = [
        'fiscal_street',
        'fiscal_exterior_number',
        'fiscal_interior_number',
        'fiscal_colonia',
        'fiscal_localidad',
        'fiscal_municipio',
        'fiscal_state',
    ];
    for (const key of optional) {
        if (data[key] !== undefined) {
            dto[key] = data[key];
        }
    }
    return dto;
}
//# sourceMappingURL=customers.service.js.map