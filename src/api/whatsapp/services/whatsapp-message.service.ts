import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { WhatsappMessage } from '../../../entities/whatsapp/whatsapp-message.entity';
import {
  QueryWhatsappMessagesDto,
  SendWhatsappFileDto,
  SendWhatsappTextDto,
} from '../dto/whatsapp.dto';
import {
  DEFAULT_DAILY_LIMIT,
  DEFAULT_MAX_DELAY_MS,
  DEFAULT_MIN_DELAY_MS,
  WhatsappMessageStatus,
  WhatsappMessageType,
} from '../whatsapp.constants';
import {
  extractWahaMessageId,
  isSafePublicHttpsUrl,
  isWhatsappGroupId,
  normalizeWhatsappGroupId,
  normalizeWhatsappPhone,
  randomDelay,
  shouldAdvanceStatus,
} from '../utils/whatsapp.util';
import { friendlyWahaMessage, WHATSAPP_NOT_CONNECTED_MESSAGE } from '../utils/whatsapp-errors';
import { WahaClientService, WahaError, WahaFilePayload } from './waha-client.service';
import { WhatsappSessionService } from './whatsapp-session.service';

export interface WhatsappMessageView {
  id: string;
  to_phone: string;
  chat_id: string | null;
  destination: 'phone' | 'group';
  type: string;
  body: string | null;
  file_name: string | null;
  status: string;
  error_message: string | null;
  reference_type: string | null;
  reference_id: string | null;
  sent_at: Date | null;
  delivered_at: Date | null;
  read_at: Date | null;
  created_by: string;
  created_at: Date;
}

interface EnqueueInput {
  type: WhatsappMessageType;
  phone?: string;
  group_id?: string;
  body?: string | null;
  file_url?: string;
  file_data?: string;
  file_name?: string | null;
  file_mimetype?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
}

type FileSource = Pick<WahaFilePayload, 'url' | 'data'>;

const RECOVERY_WINDOW_MS = 24 * 60 * 60 * 1000;
const STALE_SENDING_MS = 2 * 60 * 1000;

@Injectable()
export class WhatsappMessageService implements OnApplicationBootstrap {
  private readonly logger = new Logger(WhatsappMessageService.name);
  private readonly chains = new Map<string, Promise<void>>();
  private readonly files = new Map<string, FileSource>();

  constructor(
    @InjectRepository(WhatsappMessage)
    private readonly messageRepo: Repository<WhatsappMessage>,
    private readonly sessions: WhatsappSessionService,
    private readonly waha: WahaClientService,
  ) {}

  onApplicationBootstrap(): void {
    setTimeout(() => {
      this.recover().catch((error) =>
        this.logger.warn(`No se pudo recuperar la cola de WhatsApp: ${error?.message}`),
      );
    }, 5000);
  }

  sendText(tenantId: string, userId: string, dto: SendWhatsappTextDto): Promise<WhatsappMessageView> {
    const text = dto.text.trim();
    if (!text) throw new BadRequestException('El mensaje no puede estar vacío.');
    return this.enqueue(tenantId, userId, {
      type: 'text',
      phone: dto.phone,
      group_id: dto.group_id,
      body: text,
      reference_type: dto.reference_type,
      reference_id: dto.reference_id,
    });
  }

  sendFile(tenantId: string, userId: string, dto: SendWhatsappFileDto): Promise<WhatsappMessageView> {
    if (!isSafePublicHttpsUrl(dto.file_url)) {
      throw new BadRequestException('La URL del archivo debe ser https y pública.');
    }
    return this.enqueue(tenantId, userId, {
      type: 'file',
      phone: dto.phone,
      group_id: dto.group_id,
      body: dto.caption?.trim() || null,
      file_url: dto.file_url,
      file_name: dto.file_name?.trim() || null,
      file_mimetype: dto.mimetype ?? null,
      reference_type: dto.reference_type,
      reference_id: dto.reference_id,
    });
  }

  sendBuffer(
    tenantId: string,
    userId: string,
    input: {
      phone?: string;
      group_id?: string;
      data: Buffer;
      file_name: string;
      mimetype: string;
      caption?: string | null;
      reference_type?: string | null;
      reference_id?: string | null;
    },
  ): Promise<WhatsappMessageView> {
    return this.enqueue(tenantId, userId, {
      type: 'file',
      phone: input.phone,
      group_id: input.group_id,
      body: input.caption?.trim() || null,
      file_data: input.data.toString('base64'),
      file_name: input.file_name,
      file_mimetype: input.mimetype,
      reference_type: input.reference_type,
      reference_id: input.reference_id,
    });
  }

  async list(
    tenantId: string,
    query: QueryWhatsappMessagesDto,
  ): Promise<{
    data: WhatsappMessageView[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const qb = this.messageRepo
      .createQueryBuilder('m')
      .where('m.tenant_id = :tenantId', { tenantId });
    if (query.status) qb.andWhere('m.status = :status', { status: query.status });
    if (query.reference_type) {
      qb.andWhere('m.reference_type = :referenceType', { referenceType: query.reference_type });
    }
    if (query.reference_id) {
      qb.andWhere('m.reference_id = :referenceId', { referenceId: query.reference_id });
    }
    if (query.phone) {
      const digits = query.phone.replace(/\D/g, '');
      if (digits) qb.andWhere('m.to_phone LIKE :phone', { phone: `%${digits}%` });
    }
    qb.orderBy('m.created_at', 'DESC');
    const total = await qb.getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    const totalPages = Math.ceil(total / limit);
    return {
      data: rows.map((row) => this.toView(row)),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async findOne(tenantId: string, id: string): Promise<WhatsappMessageView> {
    const row = await this.messageRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!row) throw new NotFoundException('Mensaje no encontrado.');
    return this.toView(row);
  }

  async applyAck(
    sessionName: string,
    wahaMessageId: string,
    next: WhatsappMessageStatus,
  ): Promise<void> {
    const row = await this.messageRepo.findOne({
      where: { session_name: sessionName, waha_message_id: wahaMessageId },
    });
    if (!row) return;
    const current = row.status as WhatsappMessageStatus;
    if (!shouldAdvanceStatus(current, next)) return;
    const now = new Date();
    row.status = next;
    if (next === 'delivered') row.delivered_at = row.delivered_at ?? now;
    if (next === 'read') {
      row.delivered_at = row.delivered_at ?? now;
      row.read_at = row.read_at ?? now;
    }
    if (next === 'failed') row.error_message = 'WhatsApp no pudo entregar el mensaje.';
    await this.messageRepo.save(row);
  }

  private async enqueue(
    tenantId: string,
    userId: string,
    input: EnqueueInput,
  ): Promise<WhatsappMessageView> {
    const session = await this.sessions.requireConnected(tenantId);
    const destination = this.resolveDestination(input);
    await this.assertDailyLimit(tenantId);

    const saved = await this.messageRepo.save(
      this.messageRepo.create({
        tenant_id: tenantId,
        session_name: session.session_name,
        to_phone: destination.to,
        chat_id: destination.chatId,
        type: input.type,
        body: input.body ?? null,
        file_name: input.file_name ?? null,
        file_mimetype: input.file_mimetype ?? null,
        status: 'queued',
        reference_type: input.reference_type ?? null,
        reference_id: input.reference_id ?? null,
        created_by: userId,
      }),
    );
    if (input.file_url) this.files.set(saved.id, { url: input.file_url });
    else if (input.file_data) this.files.set(saved.id, { data: input.file_data });
    this.schedule(session.session_name, saved.id);
    return this.toView(saved);
  }

  private async assertDailyLimit(tenantId: string): Promise<void> {
    const limit = Number(process.env.WHATSAPP_DAILY_LIMIT) || DEFAULT_DAILY_LIMIT;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const sentToday = await this.messageRepo
      .createQueryBuilder('m')
      .where('m.tenant_id = :tenantId', { tenantId })
      .andWhere('m.created_at >= :since', { since: startOfDay })
      .andWhere("m.status <> 'failed'")
      .getCount();
    if (sentToday >= limit) {
      throw new HttpException(
        `Alcanzaste el límite diario de ${limit} mensajes de WhatsApp.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private schedule(sessionName: string, messageId: string): void {
    const previous = this.chains.get(sessionName) ?? Promise.resolve();
    const next = previous.then(async () => {
      try {
        await this.process(messageId);
      } catch (error) {
        this.logger.error(`Fallo inesperado enviando ${messageId}: ${error?.message}`);
      }
      const min = Number(process.env.WHATSAPP_MIN_DELAY_MS) || DEFAULT_MIN_DELAY_MS;
      const max = Number(process.env.WHATSAPP_MAX_DELAY_MS) || DEFAULT_MAX_DELAY_MS;
      await sleep(randomDelay(min, max));
    });
    this.chains.set(sessionName, next);
    void next.finally(() => {
      if (this.chains.get(sessionName) === next) this.chains.delete(sessionName);
    });
  }

  private async process(messageId: string): Promise<void> {
    const claim = await this.messageRepo.update(
      { id: messageId, status: 'queued' },
      { status: 'sending' },
    );
    if (!claim.affected) return;
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) return;

    const session = await this.sessions.findBySessionName(message.session_name);
    if (!session || session.status !== 'WORKING') {
      await this.fail(message, WHATSAPP_NOT_CONNECTED_MESSAGE);
      return;
    }

    try {
      const chatId = await this.resolveChatId(message);
      if (!chatId) return;

      let result: unknown;
      if (message.type === 'file') {
        const source = this.files.get(message.id);
        if (!source) {
          await this.fail(message, 'No se pudo recuperar el archivo. Vuelve a enviarlo.');
          return;
        }
        const payload: WahaFilePayload = {
          ...source,
          ...(message.file_name ? { filename: message.file_name } : {}),
          ...(message.file_mimetype ? { mimetype: message.file_mimetype } : {}),
        };
        const asImage = (message.file_mimetype ?? '').startsWith('image/');
        result = asImage
          ? await this.waha.sendImage(message.session_name, chatId, payload, message.body ?? undefined)
          : await this.waha.sendFile(message.session_name, chatId, payload, message.body ?? undefined);
      } else {
        await this.simulateTyping(message.session_name, chatId, message.body?.length ?? 0);
        result = await this.waha.sendText(message.session_name, chatId, message.body ?? '');
      }

      await this.messageRepo.update(
        { id: message.id, status: 'sending' },
        {
          status: 'sent',
          chat_id: chatId,
          waha_message_id: extractWahaMessageId(result),
          sent_at: new Date(),
          error_message: null,
        },
      );
    } catch (error) {
      if (error instanceof WahaError && (error.isNotFound || error.isSessionUnavailable)) {
        await this.sessions.markUnavailable(message.session_name, WHATSAPP_NOT_CONNECTED_MESSAGE);
      }
      await this.fail(message, friendlyWahaMessage(error));
    } finally {
      this.files.delete(message.id);
    }
  }

  private async simulateTyping(session: string, chatId: string, length: number): Promise<void> {
    try {
      await this.waha.startTyping(session, chatId);
      await sleep(Math.min(4000, 800 + length * 25));
      await this.waha.stopTyping(session, chatId);
    } catch {
    }
  }

  private async fail(message: WhatsappMessage, reason: string): Promise<void> {
    await this.messageRepo.update(
      { id: message.id },
      { status: 'failed', error_message: reason.slice(0, 500) },
    );
  }

  private async recover(): Promise<void> {
    const staleBefore = new Date(Date.now() - STALE_SENDING_MS);
    await this.messageRepo
      .createQueryBuilder()
      .update(WhatsappMessage)
      .set({
        status: 'failed',
        error_message: 'El envío se interrumpió. Verifica en WhatsApp antes de reintentar.',
      })
      .where("status = 'sending'")
      .andWhere('updated_at < :staleBefore', { staleBefore })
      .execute();

    const pending = await this.messageRepo.find({
      where: {
        status: 'queued',
        created_at: MoreThanOrEqual(new Date(Date.now() - RECOVERY_WINDOW_MS)),
      },
      order: { created_at: 'ASC' },
    });
    for (const message of pending) {
      if (message.type === 'file') {
        await this.fail(message, 'El envío se interrumpió. Vuelve a enviar el archivo.');
        continue;
      }
      this.schedule(message.session_name, message.id);
    }
    if (pending.length) this.logger.log(`Reencoladas ${pending.length} mensajes de WhatsApp.`);
  }

  private resolveDestination(input: EnqueueInput): { to: string; chatId: string | null } {
    const groupId = input.group_id?.trim() ? normalizeWhatsappGroupId(input.group_id) : null;
    if (input.group_id?.trim() && !groupId) {
      throw new BadRequestException('El identificador del grupo no es válido.');
    }
    if (groupId) return { to: groupId, chatId: groupId };

    const phone = normalizeWhatsappPhone(
      input.phone ?? '',
      process.env.WHATSAPP_DEFAULT_COUNTRY_CODE?.trim() || undefined,
    );
    if (!phone) {
      throw new BadRequestException(
        input.phone?.trim()
          ? 'El número de teléfono no es válido.'
          : 'Indica un teléfono o un grupo.',
      );
    }
    return { to: phone, chatId: null };
  }

  private async resolveChatId(message: WhatsappMessage): Promise<string | null> {
    if (isWhatsappGroupId(message.chat_id) || isWhatsappGroupId(message.to_phone)) {
      const groupId = normalizeWhatsappGroupId(message.chat_id || message.to_phone);
      if (!groupId) {
        await this.fail(message, 'El identificador del grupo no es válido.');
        return null;
      }
      return groupId;
    }
    const check = await this.waha.checkNumberExists(message.session_name, message.to_phone);
    if (!check?.numberExists) {
      await this.fail(
        message,
        'El número no tiene WhatsApp. Si es de otro país, escríbelo con su código (por ejemplo +1 para Estados Unidos).',
      );
      return null;
    }
    return check.chatId || `${message.to_phone}@c.us`;
  }

  private toView(row: WhatsappMessage): WhatsappMessageView {
    return {
      id: row.id,
      to_phone: row.to_phone,
      chat_id: row.chat_id,
      destination: isWhatsappGroupId(row.chat_id || row.to_phone) ? 'group' : 'phone',
      type: row.type,
      body: row.body,
      file_name: row.file_name,
      status: row.status,
      error_message: row.error_message,
      reference_type: row.reference_type,
      reference_id: row.reference_id,
      sent_at: row.sent_at,
      delivered_at: row.delivered_at,
      read_at: row.read_at,
      created_by: row.created_by,
      created_at: row.created_at,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
