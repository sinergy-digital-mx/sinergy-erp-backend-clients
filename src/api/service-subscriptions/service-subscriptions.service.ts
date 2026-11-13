import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import JSZip from 'jszip';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ServiceSubscription } from '../../entities/service-subscriptions/service-subscription.entity';
import { ServiceSubscriptionPeriod } from '../../entities/service-subscriptions/service-subscription-period.entity';
import { ServiceSubscriptionStatus } from '../../entities/service-subscriptions/service-subscription-status.enum';
import { ServiceSubscriptionPeriodStatus } from '../../entities/service-subscriptions/service-subscription-period-status.enum';
import { Customer } from '../../entities/customers/customer.entity';
import { Product } from '../../entities/products/product.entity';
import { ProductUoM } from '../../entities/products/product-uom.entity';
import { ProductItemKind } from '../../entities/products/product-item-kind.enum';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { CreateServiceSubscriptionDto } from './dto/create-service-subscription.dto';
import { UpdateServiceSubscriptionDto } from './dto/update-service-subscription.dto';
import { QueryServiceSubscriptionDto } from './dto/query-service-subscription.dto';
import { LinkServiceSubscriptionPeriodDto } from './dto/link-service-subscription-period.dto';
import { RenewServiceSubscriptionDto } from './dto/renew-service-subscription.dto';
import { VEXIA_TENANT_ID } from './service-subscription.constants';
import { ServiceSubscriptionBillingService } from './service-subscription-billing.service';
import { MailerConfigurationService } from '../mailer-configuration/services/mailer-configuration.service';
import { ElectronicInvoicePdfService } from '../electronic-invoicing/services/electronic-invoice-pdf.service';
import {
  buildSubscriptionSummaryEmail,
  stampStatusLabel,
  SubscriptionSummaryEmailInput,
  SubscriptionSummaryMonth,
} from './utils/service-subscription-summary-email.util';
import { renderSubscriptionSummaryPdf } from './utils/service-subscription-summary-pdf.util';
import {
  buildPaymentReminderCaption,
  PaymentReminderImageInput,
  renderPaymentReminderImage,
} from './utils/service-subscription-reminder-image.util';
import { SendPaymentReminderDto } from './dto/send-payment-reminder.dto';
import { WhatsappMessageService } from '../whatsapp/services/whatsapp-message.service';
import {
  addMonths,
  billingDate,
  formatPeriodLabel,
  listPeriodMonths,
  normalizeMonthStart,
} from './utils/service-subscription-months.util';

type PeriodCounts = { total: number; covered: number };

@Injectable()
export class ServiceSubscriptionsService {
  constructor(
    @InjectRepository(ServiceSubscription)
    private readonly subscriptionRepo: Repository<ServiceSubscription>,
    @InjectRepository(ServiceSubscriptionPeriod)
    private readonly periodRepo: Repository<ServiceSubscriptionPeriod>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductUoM)
    private readonly productUomRepo: Repository<ProductUoM>,
    @InjectRepository(BillingBranch)
    private readonly branchRepo: Repository<BillingBranch>,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    private readonly billing: ServiceSubscriptionBillingService,
    private readonly invoicePdf: ElectronicInvoicePdfService,
    private readonly mailerConfigurationService: MailerConfigurationService,
    private readonly whatsapp: WhatsappMessageService,
  ) {}

    async list(tenantId: string, query: QueryServiceSubscriptionDto) {
        this.assertVexia(tenantId);
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const qb = this.subscriptionRepo
            .createQueryBuilder('subscription')
            .leftJoinAndSelect('subscription.customer', 'customer')
            .leftJoinAndSelect('subscription.fiscal_configuration', 'fiscal_configuration')
            .where('subscription.tenant_id = :tenantId', { tenantId })
            .orderBy('subscription.start_month', 'DESC')
            .addOrderBy('subscription.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        if (query.status) {
            qb.andWhere('subscription.status = :status', { status: query.status });
        }
        if (query.customer_id) {
            qb.andWhere('subscription.customer_id = :customerId', { customerId: query.customer_id });
        }
        if (query.search?.trim()) {
            qb.andWhere(`(subscription.title LIKE :search OR customer.name LIKE :search OR customer.lastname LIKE :search OR customer.company_name LIKE :search OR customer.fiscal_razon_social LIKE :search)`, { search: `%${query.search.trim()}%` });
        }
        const [rows, total] = await qb.getManyAndCount();
        const ids = rows.map((row) => row.id);
        const counts = await this.periodCounts(ids);
        return {
            data: rows.map((row) => this.toListItem(row, counts.get(row.id))),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 0,
        };
    }
    async findBySalesOrder(tenantId: string, salesOrderId: string) {
        if (tenantId !== VEXIA_TENANT_ID) {
            return { subscription: null };
        }
        const period = await this.periodRepo.findOne({
            where: { tenant_id: tenantId, sales_order_id: salesOrderId },
            relations: ['subscription'],
        });
        if (!period?.subscription) {
            return { subscription: null };
        }
        return {
            subscription: {
                id: period.subscription.id,
                title: period.subscription.title,
                period_label: formatPeriodLabel(String(period.period_month)),
            },
        };
    }
    async sendSummaryEmail(tenantId: string, id: string, toEmail?: string) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        await this.billing.syncPeriodInvoices(subscription);
        const recipient = (toEmail || subscription.customer?.email || '').trim();
        if (!recipient) {
            throw new BadRequestException('Indica un correo. El cliente no tiene uno registrado.');
        }
        const summary = await this.buildSummaryInput(tenantId, subscription);
        const zip = new JSZip();
        let pdfCount = 0;
        for (const period of subscription.periods ?? []) {
            const invoice = period.sales_order_id
                ? await this.billing.findVigenteInvoice(tenantId, period.sales_order_id)
                : null;
            if (!invoice?.pdf_stamped_s3_key)
                continue;
            try {
                const pdf = await this.invoicePdf.getPdfBuffer(invoice);
                const folio = [invoice.series, invoice.folio].filter(Boolean).join('-');
                const stamp = (invoice.uuid || invoice.id).slice(0, 8);
                const base = [formatPeriodLabel(String(period.period_month)), folio || period.sales_order?.folio || 'factura', stamp]
                    .join('-')
                    .replace(/[^\w.\-áéíóúñÁÉÍÓÚÑ ]+/g, '')
                    .replace(/\s+/g, '-');
                zip.file(`${base}.pdf`, pdf.buffer);
                pdfCount += 1;
            }
            catch {
            }
        }
        const zipFileName = pdfCount ? `facturas-${subscription.title.replace(/[^\w.\-]+/g, '-').slice(0, 40)}.zip` : null;
        const zipBuffer = pdfCount ? await zip.generateAsync({ type: 'nodebuffer' }) : null;
        const message = buildSubscriptionSummaryEmail({ ...summary, zipFileName, pdfCount });
        await this.sendViaResend(tenantId, recipient, message.subject, message.html, zipBuffer && zipFileName
            ? [{ filename: zipFileName, content: zipBuffer.toString('base64') }]
            : []);
        return { sent_to: recipient, pdf_count: pdfCount };
    }
    async buildSummaryPdf(tenantId: string, id: string) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        await this.billing.syncPeriodInvoices(subscription);
        const summary = await this.buildSummaryInput(tenantId, subscription);
        const buffer = await renderSubscriptionSummaryPdf({ ...summary, zipFileName: null, pdfCount: 0 });
        const fileName = `resumen-${subscription.title.replace(/[^\w.\-]+/g, '-').slice(0, 48)}.pdf`;
        return { buffer, fileName };
    }
    private async buildSummaryInput(
    tenantId: string,
    subscription: ServiceSubscription,
  ): Promise<Omit<SubscriptionSummaryEmailInput, 'zipFileName' | 'pdfCount'>> {
        const months: SubscriptionSummaryMonth[] = [];
        for (const period of subscription.periods ?? []) {
            months.push((await this.buildMonthSummary(tenantId, period)).month);
        }
        return {
            title: subscription.title,
            customerName: this.customerName(subscription.customer),
            issuerName: subscription.fiscal_configuration?.razon_social || 'Razón social',
            issuerRfc: subscription.fiscal_configuration?.rfc ?? null,
            startLabel: formatPeriodLabel(String(subscription.start_month)),
            endLabel: formatPeriodLabel(String(subscription.end_month)),
            monthlyAmount: Number(subscription.monthly_amount),
            ivaPercentage: Number(subscription.iva_percentage),
            months,
        };
    }
    private async buildMonthSummary(tenantId: string, period: ServiceSubscriptionPeriod) {
        const invoice = period.sales_order_id
            ? await this.billing.findVigenteInvoice(tenantId, period.sales_order_id)
            : null;
        const folio = [invoice?.series, invoice?.folio].filter(Boolean).join('-');
        const payment = period.sales_order?.payment_status;
        const month: SubscriptionSummaryMonth = {
            label: formatPeriodLabel(String(period.period_month)),
            amount: Number(period.amount),
            orderFolio: period.sales_order?.folio ?? null,
            invoiceFolio: invoice ? folio || null : null,
            invoiceUuid: invoice?.uuid ?? null,
            invoiceTotal: invoice ? Number(invoice.total) : null,
            stampStatus: invoice ? stampStatusLabel(invoice.stamp_status) : null,
            satStatus: invoice?.sat_status ?? null,
            stampedAt: invoice?.stamped_at
                ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(invoice.stamped_at))
                : null,
            paid: period.sales_order ? payment === 'Pagado' : null,
        };
        return { month, invoice };
    }
    async sendPaymentReminder(
    tenantId: string,
    userId: string,
    id: string,
    periodId: string,
    dto: SendPaymentReminderDto,
  ) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        const period = this.findPeriod(subscription, periodId);
        if (!period.sales_order_id) {
            throw new BadRequestException('Este mes aún no tiene orden. Genera la orden antes de enviar el recordatorio.');
        }
        const dest = this.reminderDestination(dto, subscription.customer);
        await this.billing.syncPeriodInvoices(subscription);
        const { month, invoice } = await this.buildMonthSummary(tenantId, period);
        if (month.paid) {
            throw new BadRequestException('Este mes ya está pagado.');
        }
        const ivaPercentage = Number(subscription.iva_percentage);
        const input: PaymentReminderImageInput = {
            title: subscription.title,
            customerName: this.customerName(subscription.customer),
            issuerName: subscription.fiscal_configuration?.razon_social || 'Razón social',
            issuerRfc: subscription.fiscal_configuration?.rfc ?? null,
            monthlyAmount: Number(subscription.monthly_amount),
            ivaPercentage,
            totalDue: month.invoiceTotal ?? Math.round(month.amount * (1 + ivaPercentage / 100) * 100) / 100,
            month,
        };
        const caption = buildPaymentReminderCaption(input);
        const reference = { reference_type: 'service_subscription_period', reference_id: period.id };
        const image = renderPaymentReminderImage(input);
        const first = image
            ? await this.whatsapp.sendBuffer(tenantId, userId, {
                ...dest,
                data: image,
                file_name: `recordatorio-${month.label.replace(/\s+/g, '-')}.png`,
                mimetype: 'image/png',
                caption,
                ...reference,
            })
            : await this.whatsapp.sendText(tenantId, userId, { ...dest, text: caption, ...reference });
        let invoiceAttached = false;
        if (invoice?.pdf_stamped_s3_key) {
            try {
                const pdf = await this.invoicePdf.getPdfBuffer(invoice);
                await this.whatsapp.sendBuffer(tenantId, userId, {
                    ...dest,
                    data: pdf.buffer,
                    file_name: pdf.fileName,
                    mimetype: 'application/pdf',
                    caption: month.invoiceFolio ? `Factura ${month.invoiceFolio}` : 'Factura',
                    ...reference,
                });
                invoiceAttached = true;
            }
            catch (error) {
                if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS)
                    throw error;
            }
        }
        return {
            sent_to: first.to_phone,
            image_sent: !!image,
            invoice_attached: invoiceAttached,
        };
    }
    private reminderDestination(
    dto: SendPaymentReminderDto,
    customer: Customer | null | undefined,
  ): { group_id: string } | { phone: string } {
        if (dto.group_id?.trim())
            return { group_id: dto.group_id.trim() };
        const phone = (dto.phone || this.customerWhatsappPhone(customer)).trim();
        if (!phone) {
            throw new BadRequestException('Indica un teléfono o un grupo. El cliente no tiene uno registrado.');
        }
        return { phone };
    }
    private customerWhatsappPhone(customer: Customer | null | undefined): string {
        if (!customer)
            return '';
        const candidates: Array<[unknown, unknown]> = [
            [customer.phone, customer.phone_code],
            [customer.additional_phone, customer.additional_phone_code],
        ];
        for (const [phone, code] of candidates) {
            const digits = String(phone ?? '').replace(/\D/g, '');
            if (!digits)
                continue;
            const codeDigits = String(code ?? '').replace(/\D/g, '');
            return digits.length <= 10 && codeDigits ? `${codeDigits}${digits}` : digits;
        }
        return '';
    }
    private async sendViaResend(
    tenantId: string,
    toEmail: string,
    subject: string,
    html: string,
    attachments: Array<{ filename: string; content: string }> = [],
  ): Promise<void> {
        let config: Awaited<ReturnType<MailerConfigurationService['findActiveInternal']>>;
        try {
            config = await this.mailerConfigurationService.findActiveInternal(tenantId);
        }
        catch {
            throw new BadRequestException('No hay una configuración de correo activa. Configúrala en Sistema.');
        }
        const vendorConfig = this.mailerConfigurationService.decryptVendorConfig(config);
        if (config.vendor !== 'resend') {
            throw new BadRequestException(`El proveedor de correo "${config.vendor}" aún no está soportado para envío.`);
        }
        const fromEmail = 'fromEmail' in vendorConfig ? vendorConfig.fromEmail : undefined;
        if (!fromEmail || !('apiKey' in vendorConfig) || !vendorConfig.apiKey) {
            throw new BadRequestException('La configuración de correo activa no tiene remitente o apiKey.');
        }
        const fromName = 'fromName' in vendorConfig ? vendorConfig.fromName : undefined;
        await axios.post('https://api.resend.com/emails', {
            from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
            to: [toEmail],
            subject,
            html,
            attachments: attachments.length ? attachments : undefined,
        }, { headers: { Authorization: `Bearer ${vendorConfig.apiKey}` } });
    }
    async getOne(tenantId: string, id: string) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        await this.billing.syncPeriodInvoices(subscription);
        return this.toDetail(subscription);
    }
    async create(tenantId: string, userId: string, dto: CreateServiceSubscriptionDto) {
        this.assertVexia(tenantId);
        await this.assertReferences(tenantId, dto);
        const months = listPeriodMonths(dto.start_month, dto.end_month);
        const subscription = this.subscriptionRepo.create({
            id: randomUUID(),
            tenant_id: tenantId,
            customer_id: dto.customer_id,
            title: dto.title.trim(),
            monthly_amount: dto.monthly_amount,
            iva_percentage: dto.iva_percentage ?? 16,
            fiscal_configuration_id: dto.fiscal_configuration_id,
            billing_branch_id: dto.billing_branch_id,
            product_id: dto.product_id,
            product_uom_id: dto.product_uom_id,
            start_month: months[0],
            end_month: months[months.length - 1],
            billing_day: dto.billing_day ?? 1,
            status: ServiceSubscriptionStatus.Active,
            uso_cfdi: (dto.uso_cfdi || 'G03').toUpperCase(),
            forma_pago: dto.forma_pago || '99',
            metodo_pago: (dto.metodo_pago || 'PPD').toUpperCase(),
            regimen_fiscal_receptor: dto.regimen_fiscal_receptor || '601',
            notes: dto.notes?.trim() || null,
            created_by: userId,
        });
        await this.subscriptionRepo.save(subscription);
        await this.periodRepo.save(months.map((month) => this.periodRepo.create({
            id: randomUUID(),
            tenant_id: tenantId,
            subscription_id: subscription.id,
            period_month: month,
            amount: dto.monthly_amount,
            status: ServiceSubscriptionPeriodStatus.Pending,
            linked_manually: false,
        })));
        return this.getOne(tenantId, subscription.id);
    }
    async update(tenantId: string, id: string, dto: UpdateServiceSubscriptionDto) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        if (subscription.status === ServiceSubscriptionStatus.Cancelled) {
            throw new BadRequestException('La suscripción está cancelada');
        }
        if (dto.title !== undefined)
            subscription.title = dto.title.trim();
        if (dto.iva_percentage !== undefined)
            subscription.iva_percentage = dto.iva_percentage;
        if (dto.billing_day !== undefined)
            subscription.billing_day = dto.billing_day;
        if (dto.uso_cfdi !== undefined)
            subscription.uso_cfdi = dto.uso_cfdi.toUpperCase();
        if (dto.forma_pago !== undefined)
            subscription.forma_pago = dto.forma_pago;
        if (dto.metodo_pago !== undefined)
            subscription.metodo_pago = dto.metodo_pago.toUpperCase();
        if (dto.regimen_fiscal_receptor !== undefined) {
            subscription.regimen_fiscal_receptor = dto.regimen_fiscal_receptor;
        }
        if (dto.notes !== undefined)
            subscription.notes = dto.notes.trim() || null;
        if (dto.monthly_amount !== undefined) {
            subscription.monthly_amount = dto.monthly_amount;
            await this.periodRepo
                .createQueryBuilder()
                .update(ServiceSubscriptionPeriod)
                .set({ amount: dto.monthly_amount })
                .where('subscription_id = :id', { id })
                .andWhere('status = :status', { status: ServiceSubscriptionPeriodStatus.Pending })
                .execute();
        }
        await this.subscriptionRepo.save(subscription);
        return this.getOne(tenantId, id);
    }
    async cancel(tenantId: string, id: string) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        subscription.status = ServiceSubscriptionStatus.Cancelled;
        await this.subscriptionRepo.save(subscription);
        return this.getOne(tenantId, id);
    }
    async renew(tenantId: string, userId: string, id: string, dto: RenewServiceSubscriptionDto) {
        this.assertVexia(tenantId);
        const current = await this.loadSubscription(tenantId, id);
        if (current.status === ServiceSubscriptionStatus.Cancelled) {
            throw new BadRequestException('No se puede renovar una suscripción cancelada');
        }
        const start = dto.start_month
            ? normalizeMonthStart(dto.start_month)
            : addMonths(String(current.end_month), 1);
        const previousLength = listPeriodMonths(String(current.start_month), String(current.end_month)).length;
        const end = dto.end_month
            ? normalizeMonthStart(dto.end_month)
            : addMonths(start, previousLength - 1);
        const created = await this.create(tenantId, userId, {
            customer_id: current.customer_id,
            title: current.title,
            monthly_amount: dto.monthly_amount ?? Number(current.monthly_amount),
            iva_percentage: Number(current.iva_percentage),
            fiscal_configuration_id: current.fiscal_configuration_id,
            billing_branch_id: current.billing_branch_id,
            product_id: current.product_id,
            product_uom_id: current.product_uom_id,
            start_month: start,
            end_month: end,
            billing_day: current.billing_day,
            uso_cfdi: current.uso_cfdi,
            forma_pago: current.forma_pago,
            metodo_pago: current.metodo_pago,
            regimen_fiscal_receptor: current.regimen_fiscal_receptor,
            notes: current.notes ?? undefined,
        });
        await this.subscriptionRepo.update(created.id, { renewed_from_id: current.id });
        if (current.status === ServiceSubscriptionStatus.Active) {
            const pending = (current.periods ?? []).some((period) => period.status === ServiceSubscriptionPeriodStatus.Pending);
            if (!pending) {
                current.status = ServiceSubscriptionStatus.Completed;
                await this.subscriptionRepo.save(current);
            }
        }
        return this.getOne(tenantId, created.id);
    }
    async generate(tenantId: string, userId: string, id: string, periodId: string) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        const period = this.findPeriod(subscription, periodId);
        await this.billing.generatePeriod(subscription, period, userId);
        return this.getOne(tenantId, id);
    }
    async invoice(tenantId: string, userId: string, id: string, periodId: string) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        const period = this.findPeriod(subscription, periodId);
        await this.billing.stampPeriod(subscription, period, userId);
        return this.getOne(tenantId, id);
    }
    async link(
    tenantId: string,
    id: string,
    periodId: string,
    dto: LinkServiceSubscriptionPeriodDto,
  ) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        const period = this.findPeriod(subscription, periodId);
        if (period.status === ServiceSubscriptionPeriodStatus.Skipped) {
            throw new BadRequestException('Ese mes está omitido');
        }
        if (period.sales_order_id && period.sales_order_id !== dto.sales_order_id) {
            throw new BadRequestException('Ese mes ya tiene una orden. Quítala antes de vincular otra');
        }
        const order = await this.salesOrderRepo.findOne({
            where: { id: dto.sales_order_id, tenant_id: tenantId },
        });
        if (!order) {
            throw new NotFoundException('Orden de venta no encontrada');
        }
        if (order.customer_id !== subscription.customer_id) {
            throw new BadRequestException('La orden es de otro cliente');
        }
        if (order.general_status === 'Cancelada') {
            throw new BadRequestException('No se puede vincular una orden cancelada');
        }
        const taken = await this.periodRepo.findOne({
            where: { sales_order_id: order.id },
        });
        if (taken && taken.id !== period.id) {
            throw new BadRequestException('Esa orden ya está ligada a otro mes');
        }
        if (dto.align_date !== false) {
            const date = billingDate(String(period.period_month), subscription.billing_day);
            await this.billing.alignOrderDate(order.id, tenantId, date);
        }
        const invoice = await this.billing.findVigenteInvoice(tenantId, order.id);
        period.sales_order_id = order.id;
        period.linked_manually = true;
        period.generated_at = period.generated_at ?? new Date();
        period.electronic_invoice_id = invoice?.id ?? null;
        period.status = invoice
            ? ServiceSubscriptionPeriodStatus.Invoiced
            : ServiceSubscriptionPeriodStatus.Linked;
        period.invoice_error = null;
        await this.periodRepo.save(period);
        return this.getOne(tenantId, id);
    }
    async skip(tenantId: string, id: string, periodId: string) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        const period = this.findPeriod(subscription, periodId);
        if (period.sales_order_id) {
            throw new BadRequestException('Quita la orden antes de omitir el mes');
        }
        period.status = ServiceSubscriptionPeriodStatus.Skipped;
        await this.periodRepo.save(period);
        return this.getOne(tenantId, id);
    }
    async unlink(tenantId: string, id: string, periodId: string) {
        this.assertVexia(tenantId);
        const subscription = await this.loadSubscription(tenantId, id);
        const period = this.findPeriod(subscription, periodId);
        if (period.status === ServiceSubscriptionPeriodStatus.Invoiced) {
            throw new BadRequestException('Ese mes ya está facturado. No se puede desvincular');
        }
        period.sales_order_id = null;
        period.electronic_invoice_id = null;
        period.linked_manually = false;
        period.invoice_error = null;
        period.generated_at = null;
        period.status = ServiceSubscriptionPeriodStatus.Pending;
        await this.periodRepo.save(period);
        return this.getOne(tenantId, id);
    }
    private async assertReferences(
    tenantId: string,
    dto: CreateServiceSubscriptionDto,
  ): Promise<void> {
        const customer = await this.customerRepo.findOne({
            where: { id: dto.customer_id, tenant_id: tenantId },
        });
        if (!customer) {
            throw new BadRequestException('Cliente no encontrado');
        }
        const product = await this.productRepo.findOne({
            where: { id: dto.product_id, tenant_id: tenantId },
        });
        if (!product || product.item_kind !== ProductItemKind.Service) {
            throw new BadRequestException('Elige un producto de tipo servicio');
        }
        const uom = await this.productUomRepo.findOne({
            where: { id: dto.product_uom_id, product_id: product.id },
        });
        if (!uom) {
            throw new BadRequestException('La unidad no pertenece a ese servicio');
        }
        const branch = await this.branchRepo.findOne({
            where: { id: dto.billing_branch_id },
            relations: ['fiscal_configuration'],
        });
        if (!branch || branch.fiscal_configuration?.tenant_id !== tenantId) {
            throw new BadRequestException('Sucursal no encontrada');
        }
        if (branch.fiscal_configuration_id !== dto.fiscal_configuration_id) {
            throw new BadRequestException('La sucursal no pertenece a la razón social seleccionada');
        }
    }
    private async loadSubscription(tenantId: string, id: string): Promise<ServiceSubscription> {
        const subscription = await this.subscriptionRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['customer', 'fiscal_configuration', 'billing_branch', 'periods', 'periods.sales_order'],
        });
        if (!subscription) {
            throw new NotFoundException('Suscripción no encontrada');
        }
        subscription.periods = (subscription.periods ?? []).sort((a, b) => String(a.period_month).localeCompare(String(b.period_month)));
        return subscription;
    }
    private findPeriod(
    subscription: ServiceSubscription,
    periodId: string,
  ): ServiceSubscriptionPeriod {
        const period = (subscription.periods ?? []).find((item) => item.id === periodId);
        if (!period) {
            throw new NotFoundException('Mes no encontrado');
        }
        return period;
    }
    private async periodCounts(ids: string[]): Promise<Map<string, PeriodCounts>> {
        const map = new Map<string, PeriodCounts>();
        if (!ids.length)
            return map;
        const rows = await this.periodRepo
            .createQueryBuilder('period')
            .select('period.subscription_id', 'subscription_id')
            .addSelect('COUNT(period.id)', 'total')
            .addSelect(`SUM(CASE WHEN period.status IN ('linked', 'invoiced') THEN 1 ELSE 0 END)`, 'covered')
            .where('period.subscription_id IN (:...ids)', { ids })
            .groupBy('period.subscription_id')
            .getRawMany();
        for (const row of rows) {
            map.set(row.subscription_id, {
                total: Number(row.total) || 0,
                covered: Number(row.covered) || 0,
            });
        }
        return map;
    }
    private customerName(customer: Customer | null | undefined): string {
        if (!customer)
            return '';
        const person = [customer.name, customer.lastname].filter(Boolean).join(' ').trim();
        return customer.fiscal_razon_social || customer.company_name || person;
    }
    private toListItem(row: ServiceSubscription, counts: PeriodCounts | undefined) {
        return {
            id: row.id,
            title: row.title,
            customer_id: row.customer_id,
            customer_name: this.customerName(row.customer),
            fiscal_razon_social: row.fiscal_configuration?.razon_social ?? null,
            fiscal_rfc: row.fiscal_configuration?.rfc ?? null,
            monthly_amount: Number(row.monthly_amount),
            iva_percentage: Number(row.iva_percentage),
            start_month: String(row.start_month).slice(0, 10),
            end_month: String(row.end_month).slice(0, 10),
            start_label: formatPeriodLabel(String(row.start_month)),
            end_label: formatPeriodLabel(String(row.end_month)),
            billing_day: row.billing_day,
            status: row.status,
            months_total: counts?.total ?? 0,
            months_covered: counts?.covered ?? 0,
        };
    }
    private toDetail(subscription: ServiceSubscription) {
        const covered = (subscription.periods ?? []).filter((period) => period.status === ServiceSubscriptionPeriodStatus.Linked ||
            period.status === ServiceSubscriptionPeriodStatus.Invoiced).length;
        return {
            ...this.toListItem(subscription, {
                total: subscription.periods?.length ?? 0,
                covered,
            }),
            fiscal_configuration_id: subscription.fiscal_configuration_id,
            customer_email: subscription.customer?.email ?? null,
            customer_phone: this.customerWhatsappPhone(subscription.customer) || null,
            billing_branch_id: subscription.billing_branch_id,
            billing_branch_code: subscription.billing_branch?.code ?? null,
            product_id: subscription.product_id,
            product_uom_id: subscription.product_uom_id,
            uso_cfdi: subscription.uso_cfdi,
            forma_pago: subscription.forma_pago,
            metodo_pago: subscription.metodo_pago,
            regimen_fiscal_receptor: subscription.regimen_fiscal_receptor,
            notes: subscription.notes,
            renewed_from_id: subscription.renewed_from_id,
            periods: (subscription.periods ?? []).map((period) => ({
                id: period.id,
                period_month: String(period.period_month).slice(0, 10),
                label: formatPeriodLabel(String(period.period_month)),
                amount: Number(period.amount),
                status: period.status,
                sales_order_id: period.sales_order_id,
                sales_order_folio: period.sales_order?.folio ?? null,
                paid: period.sales_order ? period.sales_order.payment_status === 'Pagado' : null,
                electronic_invoice_id: period.electronic_invoice_id,
                linked_manually: period.linked_manually,
                invoice_error: period.invoice_error,
            })),
        };
    }
    private assertVexia(tenantId: string): void {
        if (tenantId !== VEXIA_TENANT_ID) {
            throw new ForbiddenException('Las suscripciones de servicio solo están disponibles para Vexia.');
        }
    }
}
