import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import axios from 'axios';
import { DivinoReservationFormat } from '../../entities/divino-reservation-formats/divino-reservation-format.entity';
import { Property } from '../../entities/properties/property.entity';
import { User } from '../../entities/users/user.entity';
import { CreateDivinoReservationFormatDto } from './dto/create-divino-reservation-format.dto';
import { UpdateDivinoReservationFormatDto } from './dto/update-divino-reservation-format.dto';
import { QueryDivinoReservationFormatDto } from './dto/query-divino-reservation-format.dto';
import { SendDivinoReservationFormatDto } from './dto/send-divino-reservation-format.dto';
import { DivinoReservationFormatPdfService } from './divino-reservation-format-pdf.service';
import { MailerConfigurationService } from '../mailer-configuration/services/mailer-configuration.service';
import { DIVINO_RESERVATION_BRAND } from './divino-reservation-formats.constants';

export interface PaginatedDivinoReservationFormatDto {
  data: DivinoReservationFormat[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

@Injectable()
export class DivinoReservationFormatService {
  constructor(
    @InjectRepository(DivinoReservationFormat)
    private repo: Repository<DivinoReservationFormat>,
    @InjectRepository(Property)
    private propertyRepo: Repository<Property>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private pdfService: DivinoReservationFormatPdfService,
    private mailerConfigurationService: MailerConfigurationService,
  ) {}

  async create(
    tenantId: string,
    dto: CreateDivinoReservationFormatDto,
    userId: string | null,
  ): Promise<DivinoReservationFormat> {
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
      currency: dto.currency ?? property.currency ?? 'MXN',
      payable_to: dto.payable_to ?? DIVINO_RESERVATION_BRAND.defaultPayableTo,
      status: 'draft',
      created_by: userId,
      created_by_name: creatorName,
    });

    return this.repo.save(entity);
  }

  async findAll(
    tenantId: string,
    query?: QueryDivinoReservationFormatDto,
  ): Promise<PaginatedDivinoReservationFormatDto> {
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

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
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('LOWER(format.folio) LIKE LOWER(:search)')
            .orWhere('LOWER(format.buyer_name) LIKE LOWER(:search)')
            .orWhere('LOWER(format.buyer_email) LIKE LOWER(:search)')
            .orWhere('LOWER(format.received_from) LIKE LOWER(:search)')
            .orWhere('LOWER(format.created_by_name) LIKE LOWER(:search)')
            .orWhere('LOWER(property.code) LIKE LOWER(:search)')
            .orWhere('LOWER(property.name) LIKE LOWER(:search)')
            .orWhere('LOWER(property.cadastral_key) LIKE LOWER(:search)');
        }),
        { search: `%${query.search}%` },
      );
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

  async findOne(
    tenantId: string,
    id: string,
  ): Promise<DivinoReservationFormat> {
    const format = await this.repo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['property', 'fiscal_configuration', 'creator'],
    });

    if (!format) {
      throw new NotFoundException('Formato de reservación no encontrado');
    }

    return format;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateDivinoReservationFormatDto,
  ): Promise<DivinoReservationFormat> {
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

  async remove(tenantId: string, id: string): Promise<void> {
    const format = await this.findOne(tenantId, id);
    await this.repo.remove(format);
  }

  async generatePdf(tenantId: string, id: string): Promise<Buffer> {
    const format = await this.findOne(tenantId, id);
    return this.pdfService.generate(format);
  }

  async send(
    tenantId: string,
    id: string,
    dto: SendDivinoReservationFormatDto,
    userId: string | null,
  ): Promise<DivinoReservationFormat> {
    const format = await this.findOne(tenantId, id);

    const toEmail = dto.to_email || format.buyer_email;
    if (!toEmail) {
      throw new BadRequestException(
        'Se requiere un correo destino (buyer_email o to_email).',
      );
    }

    const pdfBuffer = await this.pdfService.generate(format);

    const config = await this.mailerConfigurationService.findActiveInternal(
      tenantId,
    );
    const vendorConfig =
      this.mailerConfigurationService.decryptVendorConfig(config);

    if (config.vendor !== 'resend') {
      throw new BadRequestException(
        `El proveedor de correo "${config.vendor}" aún no está soportado para envío.`,
      );
    }

    const fromEmail = 'fromEmail' in vendorConfig ? vendorConfig.fromEmail : undefined;
    if (!fromEmail) {
      throw new BadRequestException(
        'La configuración de correo activa no tiene fromEmail.',
      );
    }
    if (!('apiKey' in vendorConfig) || !vendorConfig.apiKey) {
      throw new BadRequestException(
        'La configuración de correo activa no tiene apiKey.',
      );
    }

    const fromName = 'fromName' in vendorConfig ? vendorConfig.fromName : undefined;
    const subject =
      dto.subject || `Formato de reservación ${format.folio} - Divino`;
    const html = this.buildEmailHtml(format, dto.message);

    await axios.post(
      'https://api.resend.com/emails',
      {
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
      },
      {
        headers: {
          Authorization: `Bearer ${vendorConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    format.status = 'sent';
    format.sent_at = new Date();
    format.sent_to = toEmail;
    format.sent_by = userId;

    return this.repo.save(format);
  }

  private buildEmailHtml(
    format: DivinoReservationFormat,
    message?: string,
  ): string {
    const greeting = format.buyer_name ? `Hola ${format.buyer_name},` : 'Hola,';
    const body =
      message ||
      'Adjuntamos tu formato de reservación. Cualquier duda estamos a tus órdenes.';

    return `
      <div style="font-family: Arial, Helvetica, sans-serif; color:#2C3E50; font-size:14px; line-height:1.6;">
        <p>${greeting}</p>
        <p>${body}</p>
        <p><strong>Folio:</strong> ${format.folio}</p>
        <p style="margin-top:24px; color:#7F8C8D; font-size:12px;">
          ${DIVINO_RESERVATION_BRAND.website} · ${DIVINO_RESERVATION_BRAND.facebook} · ${DIVINO_RESERVATION_BRAND.instagram}
        </p>
      </div>
    `;
  }

  private async getPropertyOrFail(
    tenantId: string,
    propertyId: string,
  ): Promise<Property> {
    const property = await this.propertyRepo.findOne({
      where: { id: propertyId, tenant_id: tenantId },
    });

    if (!property) {
      throw new BadRequestException('El LOTE (propiedad) seleccionado no existe.');
    }

    return property;
  }

  private async resolveUserName(
    tenantId: string,
    userId: string | null,
  ): Promise<string | null> {
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

  private async generateFolio(tenantId: string): Promise<string> {
    const count = await this.repo.count({ where: { tenant_id: tenantId } });
    const next = count + 1;
    return `DIV-RES-${String(next).padStart(6, '0')}`;
  }
}
