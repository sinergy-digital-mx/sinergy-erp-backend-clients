import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, Repository } from 'typeorm';
import axios from 'axios';
import { EmailTemplate, EmailTemplateCustomVariable } from '../../entities/email-templates/email-template.entity';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { Payment } from '../../entities/contracts/payment.entity';
import { Contract } from '../../entities/contracts/contract.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { Lead } from '../../entities/leads/lead.entity';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { QueryEmailTemplateDto } from './dto/query-email-template.dto';
import { PreviewEmailTemplateDto, RenderEmailTemplateDto } from './dto/render-email-template.dto';
import { SendEmailTemplateDto } from './dto/send-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { MailerConfigurationService } from '../mailer-configuration/services/mailer-configuration.service';
import {
  AvailableEmailTemplateEntityDto,
  AvailableEmailTemplateVariableDto,
} from './dto/email-template-variable.dto';
import {
  ALWAYS_AVAILABLE_EMAIL_TEMPLATE_VARIABLES,
  EMAIL_TEMPLATE_VARIABLE_REGISTRY,
} from './email-template-variables.registry';

export interface RenderedEmailTemplate {
  subject: string;
  bodyHtml: string;
  missingVariables: string[];
}

export interface SentEmailTemplateResult extends RenderedEmailTemplate {
  provider: string;
  providerMessageId: string;
  toEmail: string;
  cc?: string[];
  bcc?: string[];
}

@Injectable()
export class EmailTemplatesService {
  constructor(
    @InjectRepository(EmailTemplate)
    private readonly templateRepository: Repository<EmailTemplate>,
    @InjectRepository(TenantModule)
    private readonly tenantModuleRepository: Repository<TenantModule>,
    @InjectRepository(RBACTenant)
    private readonly tenantRepository: Repository<RBACTenant>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    private readonly mailerConfigurationService: MailerConfigurationService,
  ) {}

  async create(
    tenantId: string,
    dto: CreateEmailTemplateDto,
    userId: string | null,
  ): Promise<EmailTemplate> {
    await this.ensureNameAvailable(tenantId, dto.name);

    const variables = await this.normalizeAndValidateVariables(
      tenantId,
      dto.subject,
      dto.bodyHtml,
      dto.variables,
      dto.customVariables,
    );

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

  async findAll(
    tenantId: string,
    query: QueryEmailTemplateDto,
  ): Promise<{ data: EmailTemplate[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const builder = this.templateRepository
      .createQueryBuilder('template')
      .where('template.tenant_id = :tenantId', { tenantId })
      .andWhere('template.deleted_at IS NULL');

    if (query.search) {
      builder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(template.name) LIKE LOWER(:search)', { search: `%${query.search}%` })
            .orWhere('LOWER(template.subject) LIKE LOWER(:search)', { search: `%${query.search}%` });
        }),
      );
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

  async findOne(tenantId: string, id: string): Promise<EmailTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, tenant_id: tenantId, deleted_at: IsNull() },
    });

    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    return template;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateEmailTemplateDto,
    userId: string | null,
  ): Promise<EmailTemplate> {
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
      template.variables = await this.normalizeAndValidateVariables(
        tenantId,
        template.subject,
        template.body_html,
        dto.variables ?? template.variables ?? [],
        template.custom_variables ?? [],
      );
    }

    if (dto.isActive !== undefined) {
      template.is_active = dto.isActive;
    }

    template.updated_by = userId;

    return this.templateRepository.save(template);
  }

  async remove(tenantId: string, id: string, userId: string | null): Promise<void> {
    const template = await this.findOne(tenantId, id);
    template.deleted_at = new Date();
    template.deleted_by = userId;
    template.updated_by = userId;
    await this.templateRepository.save(template);
  }

  async getAvailableVariables(tenantId: string): Promise<AvailableEmailTemplateEntityDto[]> {
    const tenantModules = await this.tenantModuleRepository.find({
      where: { tenant_id: tenantId, is_enabled: true },
      relations: ['module'],
    });
    const enabledModuleCodes = new Set(tenantModules.map((tenantModule) => tenantModule.module?.code).filter(Boolean));

    return [
      ...ALWAYS_AVAILABLE_EMAIL_TEMPLATE_VARIABLES,
      ...EMAIL_TEMPLATE_VARIABLE_REGISTRY.filter((entry) => enabledModuleCodes.has(entry.moduleCode)),
    ];
  }

  async render(
    tenantId: string,
    id: string,
    dto: RenderEmailTemplateDto,
  ): Promise<RenderedEmailTemplate> {
    const template = await this.findOne(tenantId, id);
    const variables = await this.resolveRenderVariables(tenantId, dto);
    return this.renderContent(template.subject, template.body_html, variables);
  }

  async preview(tenantId: string, dto: PreviewEmailTemplateDto): Promise<RenderedEmailTemplate> {
    const variables = await this.resolveRenderVariables(tenantId, dto);
    return this.renderContent(dto.subject || '', dto.bodyHtml, variables);
  }

  async send(
    tenantId: string,
    id: string,
    dto: SendEmailTemplateDto,
  ): Promise<SentEmailTemplateResult> {
    const template = await this.findOne(tenantId, id);
    if (!template.is_active) {
      throw new BadRequestException('Email template is inactive');
    }

    const variables = await this.resolveRenderVariables(tenantId, dto);
    const rendered = this.renderContent(template.subject, template.body_html, variables);

    if (rendered.missingVariables.length > 0) {
      throw new BadRequestException({
        message: 'Cannot send email because template has missing variables',
        missingVariables: rendered.missingVariables,
      });
    }

    const toEmail = dto.toEmail || this.resolveRecipientEmail(variables);
    if (!toEmail) {
      throw new BadRequestException('Recipient email is required or must be available from context');
    }

    const config = await this.mailerConfigurationService.findActiveInternal(tenantId);
    const vendorConfig = this.mailerConfigurationService.decryptVendorConfig(config);

    if (config.vendor !== 'resend') {
      throw new BadRequestException(`Mailer vendor "${config.vendor}" is not supported for sending yet`);
    }

    const fromEmail = 'fromEmail' in vendorConfig ? vendorConfig.fromEmail : undefined;
    if (!fromEmail) {
      throw new BadRequestException('Active Resend configuration is missing fromEmail');
    }
    if (!('apiKey' in vendorConfig) || !vendorConfig.apiKey) {
      throw new BadRequestException('Active Resend configuration is missing apiKey');
    }

    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: this.formatFromAddress(fromEmail, 'fromName' in vendorConfig ? vendorConfig.fromName : undefined),
        to: [toEmail],
        cc: dto.cc,
        bcc: dto.bcc,
        subject: rendered.subject,
        html: rendered.bodyHtml,
        reply_to: 'replyTo' in vendorConfig ? vendorConfig.replyTo : undefined,
      },
      {
        headers: {
          Authorization: `Bearer ${vendorConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      ...rendered,
      provider: 'resend',
      providerMessageId: response.data?.id,
      toEmail,
      cc: dto.cc,
      bcc: dto.bcc,
    };
  }

  extractTemplateVariables(subject: string, bodyHtml: string): string[] {
    const content = `${subject || ''}\n${bodyHtml || ''}`;
    const regex = /{{\s*([a-zA-Z][a-zA-Z0-9_.-]*)\s*}}/g;
    const variables = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables).sort();
  }

  private renderContent(
    subject: string,
    bodyHtml: string,
    variables: Record<string, unknown>,
  ): RenderedEmailTemplate {
    const missingVariables = new Set<string>();
    const renderValue = (content: string): string =>
      content.replace(/{{\s*([a-zA-Z][a-zA-Z0-9_.-]*)\s*}}/g, (_match, key: string) => {
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

  private resolveVariableValue(key: string, variables: Record<string, unknown>): unknown {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return variables[key];
    }

    return key.split('.').reduce<unknown>((current, part) => {
      if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, part)) {
        return (current as Record<string, unknown>)[part];
      }
      return undefined;
    }, variables);
  }

  private resolveRecipientEmail(variables: Record<string, unknown>): string | null {
    const candidates = [
      this.resolveVariableValue('customer.email', variables),
      this.resolveVariableValue('lead.email', variables),
    ];

    const email = candidates.find((candidate) => typeof candidate === 'string' && candidate.includes('@'));
    return typeof email === 'string' ? email : null;
  }

  private formatFromAddress(fromEmail: string, fromName?: string): string {
    if (!fromName) {
      return fromEmail;
    }

    return `${fromName.replace(/"/g, '\\"')} <${fromEmail}>`;
  }

  private async resolveRenderVariables(
    tenantId: string,
    dto: RenderEmailTemplateDto,
  ): Promise<Record<string, unknown>> {
    if (!dto.variables && !dto.context) {
      throw new BadRequestException('Render requires either variables or context');
    }

    const contextVariables = dto.context
      ? await this.resolveContextVariables(tenantId, dto.context.entity, dto.context.id)
      : {};

    return this.deepMerge(contextVariables, dto.variables || {});
  }

  private async resolveContextVariables(
    tenantId: string,
    entity: 'payment' | 'contract' | 'customer' | 'lead',
    id: string,
  ): Promise<Record<string, unknown>> {
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
        throw new BadRequestException(`Unsupported render context entity: ${entity}`);
    }
  }

  private async resolvePaymentContext(tenantId: string, paymentId: string): Promise<Record<string, unknown>> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, tenant_id: tenantId },
      relations: ['contract', 'contract.customer', 'contract.property'],
    });

    if (!payment) {
      throw new NotFoundException('Payment context not found');
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

  private async resolveContractContext(tenantId: string, contractId: string): Promise<Record<string, unknown>> {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId, tenant_id: tenantId },
      relations: ['customer', 'property'],
    });

    if (!contract) {
      throw new NotFoundException('Contract context not found');
    }

    return this.mapContractVariables(contract);
  }

  private async resolveCustomerContext(tenantId: string, customerId: string): Promise<Record<string, unknown>> {
    const id = Number(customerId);
    if (!Number.isInteger(id)) {
      throw new BadRequestException('Customer context id must be a numeric id');
    }

    const customer = await this.customerRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer context not found');
    }

    return {
      customer: this.mapCustomerVariables(customer),
    };
  }

  private async resolveLeadContext(tenantId: string, leadId: string): Promise<Record<string, unknown>> {
    const id = Number(leadId);
    if (!Number.isInteger(id)) {
      throw new BadRequestException('Lead context id must be a numeric id');
    }

    const lead = await this.leadRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!lead) {
      throw new NotFoundException('Lead context not found');
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

  private async getTenantVariables(tenantId: string): Promise<Record<string, unknown>> {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });

    return {
      tenant: {
        name: tenant?.name,
        subdomain: tenant?.subdomain,
      },
    };
  }

  private mapContractVariables(contract?: Contract | null): Record<string, unknown> {
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

  private mapCustomerVariables(customer?: Customer | null): Record<string, unknown> | undefined {
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

  private deepMerge(
    base: Record<string, unknown>,
    override: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = { ...base };

    for (const [key, value] of Object.entries(override)) {
      const baseValue = result[key];
      if (
        baseValue &&
        value &&
        typeof baseValue === 'object' &&
        typeof value === 'object' &&
        !Array.isArray(baseValue) &&
        !Array.isArray(value)
      ) {
        result[key] = this.deepMerge(
          baseValue as Record<string, unknown>,
          value as Record<string, unknown>,
        );
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  private async normalizeAndValidateVariables(
    tenantId: string,
    subject: string,
    bodyHtml: string,
    providedVariables: string[] = [],
    customVariables: EmailTemplateCustomVariable[] = [],
  ): Promise<string[]> {
    const extractedVariables = this.extractTemplateVariables(subject, bodyHtml);
    const variables = Array.from(new Set([...providedVariables, ...extractedVariables])).sort();

    const availableVariables = await this.getAvailableVariables(tenantId);
    const allowedKeys = new Set(
      availableVariables.flatMap((entity) => entity.variables.map((variable: AvailableEmailTemplateVariableDto) => variable.key)),
    );
    const customKeys = new Set(customVariables.map((variable) => variable.key));

    const invalidVariables = variables.filter((variable) => !allowedKeys.has(variable) && !customKeys.has(variable));
    if (invalidVariables.length > 0) {
      throw new BadRequestException({
        message: 'Template contains variables that are not available for this tenant',
        invalidVariables,
      });
    }

    return variables;
  }

  private async ensureNameAvailable(tenantId: string, name: string, excludeId?: string): Promise<void> {
    const existing = await this.templateRepository.findOne({
      where: { tenant_id: tenantId, name: name.trim(), deleted_at: IsNull() },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Email template with name "${name}" already exists`);
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private formatCurrency(value: unknown, currency?: string | null): string {
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
    } catch {
      return `${currencyCode} ${amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  }
}
