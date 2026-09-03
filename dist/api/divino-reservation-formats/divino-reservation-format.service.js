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
exports.DivinoReservationFormatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = __importDefault(require("axios"));
const divino_reservation_format_entity_1 = require("../../entities/divino-reservation-formats/divino-reservation-format.entity");
const property_entity_1 = require("../../entities/properties/property.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const divino_reservation_format_pdf_service_1 = require("./divino-reservation-format-pdf.service");
const mailer_configuration_service_1 = require("../mailer-configuration/services/mailer-configuration.service");
const divino_reservation_formats_constants_1 = require("./divino-reservation-formats.constants");
let DivinoReservationFormatService = class DivinoReservationFormatService {
    repo;
    propertyRepo;
    userRepo;
    pdfService;
    mailerConfigurationService;
    constructor(repo, propertyRepo, userRepo, pdfService, mailerConfigurationService) {
        this.repo = repo;
        this.propertyRepo = propertyRepo;
        this.userRepo = userRepo;
        this.pdfService = pdfService;
        this.mailerConfigurationService = mailerConfigurationService;
    }
    async create(tenantId, dto, userId) {
        const property = await this.getPropertyOrFail(tenantId, dto.property_id);
        const creatorName = await this.resolveUserName(tenantId, userId);
        const entity = this.repo.create({
            ...dto,
            tenant_id: tenantId,
            folio: await this.generateFolio(tenantId),
            block: dto.block ?? property.block ?? null,
            lot_number: dto.lot_number ?? property.lot_number ?? null,
            surface: dto.surface ?? property.total_area ?? null,
            purchase_price: dto.purchase_price ?? property.total_price ?? null,
            currency: dto.currency ?? property.currency ?? 'USD',
            payable_to: dto.payable_to ?? divino_reservation_formats_constants_1.DIVINO_RESERVATION_BRAND.defaultPayableTo,
            status: 'draft',
            created_by: userId,
            created_by_name: creatorName,
        });
        return this.repo.save(entity);
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
        const qb = this.repo
            .createQueryBuilder('format')
            .leftJoinAndSelect('format.property', 'property')
            .leftJoinAndSelect('format.creator', 'creator')
            .where('format.tenant_id = :tenantId', { tenantId });
        if (query?.status) {
            qb.andWhere('format.status = :status', { status: query.status });
        }
        if (query?.property_id) {
            qb.andWhere('format.property_id = :propertyId', {
                propertyId: query.property_id,
            });
        }
        if (query?.search) {
            qb.andWhere(new typeorm_2.Brackets((sub) => {
                sub
                    .where('LOWER(format.folio) LIKE LOWER(:search)')
                    .orWhere('LOWER(format.buyer_name) LIKE LOWER(:search)')
                    .orWhere('LOWER(format.buyer_email) LIKE LOWER(:search)')
                    .orWhere('LOWER(format.received_from) LIKE LOWER(:search)')
                    .orWhere('LOWER(format.created_by_name) LIKE LOWER(:search)')
                    .orWhere('LOWER(property.code) LIKE LOWER(:search)')
                    .orWhere('LOWER(property.name) LIKE LOWER(:search)')
                    .orWhere('LOWER(property.cadastral_key) LIKE LOWER(:search)');
            }), { search: `%${query.search}%` });
        }
        qb.orderBy('format.created_at', 'DESC');
        const total = await qb.getCount();
        const data = await qb.skip(skip).take(limit).getMany();
        const totalPages = Math.ceil(total / limit) || 0;
        return {
            data,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }
    async findOne(tenantId, id) {
        const format = await this.repo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['property', 'fiscal_configuration', 'creator'],
        });
        if (!format) {
            throw new common_1.NotFoundException('Formato de reservación no encontrado');
        }
        return format;
    }
    async update(tenantId, id, dto) {
        const format = await this.findOne(tenantId, id);
        if (dto.property_id && dto.property_id !== format.property_id) {
            const property = await this.getPropertyOrFail(tenantId, dto.property_id);
            format.property_id = property.id;
            format.block = dto.block ?? property.block ?? null;
            format.lot_number = dto.lot_number ?? property.lot_number ?? null;
            format.surface = dto.surface ?? property.total_area ?? null;
        }
        const { property_id: _ignored, ...rest } = dto;
        Object.assign(format, rest);
        return this.repo.save(format);
    }
    async remove(tenantId, id) {
        const format = await this.findOne(tenantId, id);
        await this.repo.remove(format);
    }
    async generatePdf(tenantId, id) {
        const format = await this.findOne(tenantId, id);
        return this.pdfService.generate(format);
    }
    async send(tenantId, id, dto, userId) {
        const format = await this.findOne(tenantId, id);
        const toEmail = dto.to_email || format.buyer_email;
        if (!toEmail) {
            throw new common_1.BadRequestException('Se requiere un correo destino (buyer_email o to_email).');
        }
        const pdfBuffer = await this.pdfService.generate(format);
        const config = await this.mailerConfigurationService.findActiveInternal(tenantId);
        const vendorConfig = this.mailerConfigurationService.decryptVendorConfig(config);
        if (config.vendor !== 'resend') {
            throw new common_1.BadRequestException(`El proveedor de correo "${config.vendor}" aún no está soportado para envío.`);
        }
        const fromEmail = 'fromEmail' in vendorConfig ? vendorConfig.fromEmail : undefined;
        if (!fromEmail) {
            throw new common_1.BadRequestException('La configuración de correo activa no tiene fromEmail.');
        }
        if (!('apiKey' in vendorConfig) || !vendorConfig.apiKey) {
            throw new common_1.BadRequestException('La configuración de correo activa no tiene apiKey.');
        }
        const fromName = 'fromName' in vendorConfig ? vendorConfig.fromName : undefined;
        const subject = dto.subject || `Formato de reservación ${format.folio} - Divino`;
        const html = this.buildEmailHtml(format, dto.message);
        await axios_1.default.post('https://api.resend.com/emails', {
            from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
            to: [toEmail],
            cc: dto.cc,
            bcc: dto.bcc,
            subject,
            html,
            reply_to: 'replyTo' in vendorConfig ? vendorConfig.replyTo : undefined,
            attachments: [
                {
                    filename: `formato-reservacion-${format.folio}.pdf`,
                    content: pdfBuffer.toString('base64'),
                },
            ],
        }, {
            headers: {
                Authorization: `Bearer ${vendorConfig.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        format.status = 'sent';
        format.sent_at = new Date();
        format.sent_to = toEmail;
        format.sent_by = userId;
        return this.repo.save(format);
    }
    buildEmailHtml(format, message) {
        const greeting = format.buyer_name ? `Hola ${format.buyer_name},` : 'Hola,';
        const body = message ||
            'Adjuntamos tu formato de reservación. Cualquier duda estamos a tus órdenes.';
        return `
      <div style="font-family: Arial, Helvetica, sans-serif; color:#2C3E50; font-size:14px; line-height:1.6;">
        <p>${greeting}</p>
        <p>${body}</p>
        <p><strong>Folio:</strong> ${format.folio}</p>
        <p style="margin-top:24px; color:#7F8C8D; font-size:12px;">
          ${divino_reservation_formats_constants_1.DIVINO_RESERVATION_BRAND.website} · ${divino_reservation_formats_constants_1.DIVINO_RESERVATION_BRAND.facebook} · ${divino_reservation_formats_constants_1.DIVINO_RESERVATION_BRAND.instagram}
        </p>
      </div>
    `;
    }
    async getPropertyOrFail(tenantId, propertyId) {
        const property = await this.propertyRepo.findOne({
            where: { id: propertyId, tenant_id: tenantId },
        });
        if (!property) {
            throw new common_1.BadRequestException('El LOTE (propiedad) seleccionado no existe.');
        }
        return property;
    }
    async resolveUserName(tenantId, userId) {
        if (!userId) {
            return null;
        }
        const user = await this.userRepo.findOne({
            where: { id: userId, tenant_id: tenantId },
        });
        if (!user) {
            return null;
        }
        return [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
            user.email ||
            null;
    }
    async generateFolio(tenantId) {
        const count = await this.repo.count({ where: { tenant_id: tenantId } });
        const next = count + 1;
        return `DIV-RES-${String(next).padStart(6, '0')}`;
    }
};
exports.DivinoReservationFormatService = DivinoReservationFormatService;
exports.DivinoReservationFormatService = DivinoReservationFormatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(divino_reservation_format_entity_1.DivinoReservationFormat)),
    __param(1, (0, typeorm_1.InjectRepository)(property_entity_1.Property)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        divino_reservation_format_pdf_service_1.DivinoReservationFormatPdfService,
        mailer_configuration_service_1.MailerConfigurationService])
], DivinoReservationFormatService);
//# sourceMappingURL=divino-reservation-format.service.js.map