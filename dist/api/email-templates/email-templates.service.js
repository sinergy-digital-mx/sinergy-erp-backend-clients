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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTemplatesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = __importDefault(require("axios"));
const email_template_entity_1 = require("../../entities/email-templates/email-template.entity");
const tenant_module_entity_1 = require("../../entities/rbac/tenant-module.entity");
const tenant_entity_1 = require("../../entities/rbac/tenant.entity");
const payment_entity_1 = require("../../entities/contracts/payment.entity");
const contract_entity_1 = require("../../entities/contracts/contract.entity");
const customer_entity_1 = require("../../entities/customers/customer.entity");
const lead_entity_1 = require("../../entities/leads/lead.entity");
const mailer_configuration_service_1 = require("../mailer-configuration/services/mailer-configuration.service");
const email_template_variables_registry_1 = require("./email-template-variables.registry");
let EmailTemplatesService = class EmailTemplatesService {
    templateRepository;
    tenantModuleRepository;
    tenantRepository;
    paymentRepository;
    contractRepository;
    customerRepository;
    leadRepository;
    mailerConfigurationService;
    constructor(templateRepository, tenantModuleRepository, tenantRepository, paymentRepository, contractRepository, customerRepository, leadRepository, mailerConfigurationService) {
        this.templateRepository = templateRepository;
        this.tenantModuleRepository = tenantModuleRepository;
        this.tenantRepository = tenantRepository;
        this.paymentRepository = paymentRepository;
        this.contractRepository = contractRepository;
        this.customerRepository = customerRepository;
        this.leadRepository = leadRepository;
        this.mailerConfigurationService = mailerConfigurationService;
    }
    async create(tenantId, dto, userId) {
        await this.ensureNameAvailable(tenantId, dto.name);
        const variables = await this.normalizeAndValidateVariables(tenantId, dto.subject, dto.bodyHtml, dto.variables, dto.customVariables);
        const template = this.templateRepository.create({
            tenant_id: tenantId,
            name: dto.name.trim(),
            subject: dto.subject,
            body_html: dto.bodyHtml,
            variables,
            custom_variables: dto.customVariables || null,
            is_active: dto.isActive ?? true,
            created_by: userId,
            updated_by: userId,
        });
        return this.templateRepository.save(template);
    }
    async findAll(tenantId, query) {
        const page = Number(query.page) || 1;
        const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
        const skip = (page - 1) * limit;
        const builder = this.templateRepository
            .createQueryBuilder('template')
            .where('template.tenant_id = :tenantId', { tenantId })
            .andWhere('template.deleted_at IS NULL');
        if (query.search) {
            builder.andWhere(new typeorm_2.Brackets((qb) => {
                qb.where('LOWER(template.name) LIKE LOWER(:search)', { search: `%${query.search}%` })
                    .orWhere('LOWER(template.subject) LIKE LOWER(:search)', { search: `%${query.search}%` });
            }));
        }
        if (query.isActive !== undefined) {
            builder.andWhere('template.is_active = :isActive', { isActive: query.isActive });
        }
        const [data, total] = await builder
            .orderBy('template.created_at', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(tenantId, id) {
        const template = await this.templateRepository.findOne({
            where: { id, tenant_id: tenantId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        if (!template) {
            throw new common_1.NotFoundException('Email template not found');
        }
        return template;
    }
    async update(tenantId, id, dto, userId) {
        const template = await this.findOne(tenantId, id);
        if (dto.name !== undefined && dto.name.trim() !== template.name) {
            await this.ensureNameAvailable(tenantId, dto.name, id);
            template.name = dto.name.trim();
        }
        if (dto.subject !== undefined) {
            template.subject = dto.subject;
        }
        if (dto.bodyHtml !== undefined) {
            template.body_html = dto.bodyHtml;
        }
        if (dto.customVariables !== undefined) {
            template.custom_variables = dto.customVariables;
        }
        if (dto.variables !== undefined || dto.subject !== undefined || dto.bodyHtml !== undefined || dto.customVariables !== undefined) {
            template.variables = await this.normalizeAndValidateVariables(tenantId, template.subject, template.body_html, dto.variables ?? template.variables ?? [], template.custom_variables ?? []);
        }
        if (dto.isActive !== undefined) {
            template.is_active = dto.isActive;
        }
        template.updated_by = userId;
        return this.templateRepository.save(template);
    }
    async remove(tenantId, id, userId) {
        const template = await this.findOne(tenantId, id);
        template.deleted_at = new Date();
        template.deleted_by = userId;
        template.updated_by = userId;
        await this.templateRepository.save(template);
    }
    async getAvailableVariables(tenantId) {
        const tenantModules = await this.tenantModuleRepository.find({
            where: { tenant_id: tenantId, is_enabled: true },
            relations: ['module'],
        });
        const enabledModuleCodes = new Set(tenantModules.map((tenantModule) => tenantModule.module?.code).filter(Boolean));
        return [
            ...email_template_variables_registry_1.ALWAYS_AVAILABLE_EMAIL_TEMPLATE_VARIABLES,
            ...email_template_variables_registry_1.EMAIL_TEMPLATE_VARIABLE_REGISTRY.filter((entry) => enabledModuleCodes.has(entry.moduleCode)),
        ];
    }
    async render(tenantId, id, dto) {
        const template = await this.findOne(tenantId, id);
        const variables = await this.resolveRenderVariables(tenantId, dto);
        return this.renderContent(template.subject, template.body_html, variables);
    }
    async preview(tenantId, dto) {
        const variables = await this.resolveRenderVariables(tenantId, dto);
        return this.renderContent(dto.subject || '', dto.bodyHtml, variables);
    }
    async send(tenantId, id, dto) {
        const template = await this.findOne(tenantId, id);
        if (!template.is_active) {
            throw new common_1.BadRequestException('Email template is inactive');
        }
        const variables = await this.resolveRenderVariables(tenantId, dto);
        const rendered = this.renderContent(template.subject, template.body_html, variables);
        if (rendered.missingVariables.length > 0) {
            throw new common_1.BadRequestException({
                message: 'Cannot send email because template has missing variables',
                missingVariables: rendered.missingVariables,
            });
        }
        const toEmail = dto.toEmail || this.resolveRecipientEmail(variables);
        if (!toEmail) {
            throw new common_1.BadRequestException('Recipient email is required or must be available from context');
        }
        const config = await this.mailerConfigurationService.findActiveInternal(tenantId);
        const vendorConfig = this.mailerConfigurationService.decryptVendorConfig(config);
        if (config.vendor !== 'resend') {
            throw new common_1.BadRequestException(`Mailer vendor "${config.vendor}" is not supported for sending yet`);
        }
        const fromEmail = 'fromEmail' in vendorConfig ? vendorConfig.fromEmail : undefined;
        if (!fromEmail) {
            throw new common_1.BadRequestException('Active Resend configuration is missing fromEmail');
        }
        if (!('apiKey' in vendorConfig) || !vendorConfig.apiKey) {
            throw new common_1.BadRequestException('Active Resend configuration is missing apiKey');
        }
        const response = await axios_1.default.post('https://api.resend.com/emails', {
            from: this.formatFromAddress(fromEmail, 'fromName' in vendorConfig ? vendorConfig.fromName : undefined),
            to: [toEmail],
            cc: dto.cc,
            bcc: dto.bcc,
            subject: rendered.subject,
            html: rendered.bodyHtml,
            reply_to: 'replyTo' in vendorConfig ? vendorConfig.replyTo : undefined,
        }, {
            headers: {
                Authorization: `Bearer ${vendorConfig.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        return {
            ...rendered,
            provider: 'resend',
            providerMessageId: response.data?.id,
            toEmail,
            cc: dto.cc,
            bcc: dto.bcc,
        };
    }
    extractTemplateVariables(subject, bodyHtml) {
        const content = `${subject || ''}\n${bodyHtml || ''}`;
        const regex = /{{\s*([a-zA-Z][a-zA-Z0-9_.-]*)\s*}}/g;
        const variables = new Set();
        let match;
        while ((match = regex.exec(content)) !== null) {
            variables.add(match[1]);
        }
        return Array.from(variables).sort();
    }
    renderContent(subject, bodyHtml, variables) {
        const missingVariables = new Set();
        const renderValue = (content) => content.replace(/{{\s*([a-zA-Z][a-zA-Z0-9_.-]*)\s*}}/g, (_match, key) => {
            const value = this.resolveVariableValue(key, variables);
            if (value === undefined || value === null) {
                missingVariables.add(key);
                return '';
            }
            return this.escapeHtml(String(value));
        });
        return {
            subject: renderValue(subject || ''),
            bodyHtml: renderValue(bodyHtml || ''),
            missingVariables: Array.from(missingVariables).sort(),
        };
    }
    resolveVariableValue(key, variables) {
        if (Object.prototype.hasOwnProperty.call(variables, key)) {
            return variables[key];
        }
        return key.split('.').reduce((current, part) => {
            if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, part)) {
                return current[part];
            }
            return undefined;
        }, variables);
    }
    resolveRecipientEmail(variables) {
        const candidates = [
            this.resolveVariableValue('customer.email', variables),
            this.resolveVariableValue('lead.email', variables),
        ];
        const email = candidates.find((candidate) => typeof candidate === 'string' && candidate.includes('@'));
        return typeof email === 'string' ? email : null;
    }
    formatFromAddress(fromEmail, fromName) {
        if (!fromName) {
            return fromEmail;
        }
        return `${fromName.replace(/"/g, '\\"')} <${fromEmail}>`;
    }
    async resolveRenderVariables(tenantId, dto) {
        if (!dto.variables && !dto.context) {
            throw new common_1.BadRequestException('Render requires either variables or context');
        }
        const contextVariables = dto.context
            ? await this.resolveContextVariables(tenantId, dto.context.entity, dto.context.id)
            : {};
        return this.deepMerge(contextVariables, dto.variables || {});
    }
    async resolveContextVariables(tenantId, entity, id) {
        const tenantVariables = await this.getTenantVariables(tenantId);
        switch (entity) {
            case 'payment':
                return this.deepMerge(tenantVariables, await this.resolvePaymentContext(tenantId, id));
            case 'contract':
                return this.deepMerge(tenantVariables, await this.resolveContractContext(tenantId, id));
            case 'customer':
                return this.deepMerge(tenantVariables, await this.resolveCustomerContext(tenantId, id));
            case 'lead':
                return this.deepMerge(tenantVariables, await this.resolveLeadContext(tenantId, id));
            default:
                throw new common_1.BadRequestException(`Unsupported render context entity: ${entity}`);
        }
    }
    async resolvePaymentContext(tenantId, paymentId) {
        const payment = await this.paymentRepository.findOne({
            where: { id: paymentId, tenant_id: tenantId },
            relations: ['contract', 'contract.customer', 'contract.property'],
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment context not found');
        }
        return {
            payment: {
                payment_number: payment.payment_number,
                amount: this.formatCurrency(payment.amount, payment.contract?.currency),
                amount_paid: this.formatCurrency(payment.amount_paid, payment.contract?.currency),
                amount_pending: this.formatCurrency(payment.amount_pending, payment.contract?.currency),
                due_date: payment.due_date,
                status: payment.status,
            },
            ...this.mapContractVariables(payment.contract),
        };
    }
    async resolveContractContext(tenantId, contractId) {
        const contract = await this.contractRepository.findOne({
            where: { id: contractId, tenant_id: tenantId },
            relations: ['customer', 'property'],
        });
        if (!contract) {
            throw new common_1.NotFoundException('Contract context not found');
        }
        return this.mapContractVariables(contract);
    }
    async resolveCustomerContext(tenantId, customerId) {
        const id = Number(customerId);
        if (!Number.isInteger(id)) {
            throw new common_1.BadRequestException('Customer context id must be a numeric id');
        }
        const customer = await this.customerRepository.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer context not found');
        }
        return {
            customer: this.mapCustomerVariables(customer),
        };
    }
    async resolveLeadContext(tenantId, leadId) {
        const id = Number(leadId);
        if (!Number.isInteger(id)) {
            throw new common_1.BadRequestException('Lead context id must be a numeric id');
        }
        const lead = await this.leadRepository.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!lead) {
            throw new common_1.NotFoundException('Lead context not found');
        }
        return {
            lead: {
                name: lead.name,
                lastname: lead.lastname,
                email: lead.email,
                phone: lead.phone,
                company_name: lead.company_name,
            },
        };
    }
    async getTenantVariables(tenantId) {
        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
        return {
            tenant: {
                name: tenant?.name,
                subdomain: tenant?.subdomain,
            },
        };
    }
    mapContractVariables(contract) {
        if (!contract) {
            return {};
        }
        return {
            contract: {
                contract_number: contract.contract_number,
                contract_date: contract.contract_date,
                total_price: this.formatCurrency(contract.total_price, contract.currency),
                remaining_balance: this.formatCurrency(contract.remaining_balance, contract.currency),
                monthly_payment: this.formatCurrency(contract.monthly_payment, contract.currency),
                first_payment_date: contract.first_payment_date,
                status: contract.status,
                currency: contract.currency,
            },
            customer: this.mapCustomerVariables(contract.customer),
            property: contract.property
                ? {
                    code: contract.property.code,
                    name: contract.property.name,
                    location: contract.property.location,
                    total_area: contract.property.total_area,
                    total_price: this.formatCurrency(contract.property.total_price, contract.property.currency),
                    status: contract.property.status,
                }
                : undefined,
        };
    }
    mapCustomerVariables(customer) {
        if (!customer) {
            return undefined;
        }
        return {
            name: customer.name,
            lastname: customer.lastname,
            email: customer.email,
            phone: customer.phone,
            company_name: customer.company_name,
        };
    }
    deepMerge(base, override) {
        const result = { ...base };
        for (const [key, value] of Object.entries(override)) {
            const baseValue = result[key];
            if (baseValue &&
                value &&
                typeof baseValue === 'object' &&
                typeof value === 'object' &&
                !Array.isArray(baseValue) &&
                !Array.isArray(value)) {
                result[key] = this.deepMerge(baseValue, value);
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
    async normalizeAndValidateVariables(tenantId, subject, bodyHtml, providedVariables = [], customVariables = []) {
        const extractedVariables = this.extractTemplateVariables(subject, bodyHtml);
        const variables = Array.from(new Set([...providedVariables, ...extractedVariables])).sort();
        const availableVariables = await this.getAvailableVariables(tenantId);
        const allowedKeys = new Set(availableVariables.flatMap((entity) => entity.variables.map((variable) => variable.key)));
        const customKeys = new Set(customVariables.map((variable) => variable.key));
        const invalidVariables = variables.filter((variable) => !allowedKeys.has(variable) && !customKeys.has(variable));
        if (invalidVariables.length > 0) {
            throw new common_1.BadRequestException({
                message: 'Template contains variables that are not available for this tenant',
                invalidVariables,
            });
        }
        return variables;
    }
    async ensureNameAvailable(tenantId, name, excludeId) {
        const existing = await this.templateRepository.findOne({
            where: { tenant_id: tenantId, name: name.trim(), deleted_at: (0, typeorm_2.IsNull)() },
        });
        if (existing && existing.id !== excludeId) {
            throw new common_1.ConflictException(`Email template with name "${name}" already exists`);
        }
    }
    escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    formatCurrency(value, currency) {
        const amount = Number(value);
        const currencyCode = (currency || 'MXN').toUpperCase();
        if (!Number.isFinite(amount)) {
            return `${currencyCode} ${String(value ?? '')}`;
        }
        try {
            const formatted = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                currencyDisplay: 'narrowSymbol',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);
            return `${currencyCode} ${formatted}`;
        }
        catch {
            return `${currencyCode} ${amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`;
        }
    }
};
exports.EmailTemplatesService = EmailTemplatesService;
exports.EmailTemplatesService = EmailTemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(email_template_entity_1.EmailTemplate)),
    __param(1, (0, typeorm_1.InjectRepository)(tenant_module_entity_1.TenantModule)),
    __param(2, (0, typeorm_1.InjectRepository)(tenant_entity_1.RBACTenant)),
    __param(3, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(4, (0, typeorm_1.InjectRepository)(contract_entity_1.Contract)),
    __param(5, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(6, (0, typeorm_1.InjectRepository)(lead_entity_1.Lead)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        mailer_configuration_service_1.MailerConfigurationService])
], EmailTemplatesService);
//# sourceMappingURL=email-templates.service.js.map