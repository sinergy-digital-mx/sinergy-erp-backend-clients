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
var WhatsappMessageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappMessageService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const whatsapp_message_entity_1 = require("../../../entities/whatsapp/whatsapp-message.entity");
const whatsapp_constants_1 = require("../whatsapp.constants");
const whatsapp_util_1 = require("../utils/whatsapp.util");
const whatsapp_errors_1 = require("../utils/whatsapp-errors");
const waha_client_service_1 = require("./waha-client.service");
const whatsapp_session_service_1 = require("./whatsapp-session.service");
const RECOVERY_WINDOW_MS = 24 * 60 * 60 * 1000;
const STALE_SENDING_MS = 2 * 60 * 1000;
let WhatsappMessageService = WhatsappMessageService_1 = class WhatsappMessageService {
    messageRepo;
    sessions;
    waha;
    logger = new common_1.Logger(WhatsappMessageService_1.name);
    chains = new Map();
    files = new Map();
    constructor(messageRepo, sessions, waha) {
        this.messageRepo = messageRepo;
        this.sessions = sessions;
        this.waha = waha;
    }
    onApplicationBootstrap() {
        setTimeout(() => {
            this.recover().catch((error) => this.logger.warn(`No se pudo recuperar la cola de WhatsApp: ${error?.message}`));
        }, 5000);
    }
    sendText(tenantId, userId, dto) {
        const text = dto.text.trim();
        if (!text)
            throw new common_1.BadRequestException('El mensaje no puede estar vacío.');
        return this.enqueue(tenantId, userId, {
            type: 'text',
            phone: dto.phone,
            body: text,
            reference_type: dto.reference_type,
            reference_id: dto.reference_id,
        });
    }
    sendFile(tenantId, userId, dto) {
        if (!(0, whatsapp_util_1.isSafePublicHttpsUrl)(dto.file_url)) {
            throw new common_1.BadRequestException('La URL del archivo debe ser https y pública.');
        }
        return this.enqueue(tenantId, userId, {
            type: 'file',
            phone: dto.phone,
            body: dto.caption?.trim() || null,
            file_url: dto.file_url,
            file_name: dto.file_name?.trim() || null,
            file_mimetype: dto.mimetype ?? null,
            reference_type: dto.reference_type,
            reference_id: dto.reference_id,
        });
    }
    sendBuffer(tenantId, userId, input) {
        return this.enqueue(tenantId, userId, {
            type: 'file',
            phone: input.phone,
            body: input.caption?.trim() || null,
            file_data: input.data.toString('base64'),
            file_name: input.file_name,
            file_mimetype: input.mimetype,
            reference_type: input.reference_type,
            reference_id: input.reference_id,
        });
    }
    async list(tenantId, query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        const qb = this.messageRepo
            .createQueryBuilder('m')
            .where('m.tenant_id = :tenantId', { tenantId });
        if (query.status)
            qb.andWhere('m.status = :status', { status: query.status });
        if (query.reference_type) {
            qb.andWhere('m.reference_type = :referenceType', { referenceType: query.reference_type });
        }
        if (query.reference_id) {
            qb.andWhere('m.reference_id = :referenceId', { referenceId: query.reference_id });
        }
        if (query.phone) {
            const digits = query.phone.replace(/\D/g, '');
            if (digits)
                qb.andWhere('m.to_phone LIKE :phone', { phone: `%${digits}%` });
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
    async findOne(tenantId, id) {
        const row = await this.messageRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!row)
            throw new common_1.NotFoundException('Mensaje no encontrado.');
        return this.toView(row);
    }
    async applyAck(sessionName, wahaMessageId, next) {
        const row = await this.messageRepo.findOne({
            where: { session_name: sessionName, waha_message_id: wahaMessageId },
        });
        if (!row)
            return;
        const current = row.status;
        if (!(0, whatsapp_util_1.shouldAdvanceStatus)(current, next))
            return;
        const now = new Date();
        row.status = next;
        if (next === 'delivered')
            row.delivered_at = row.delivered_at ?? now;
        if (next === 'read') {
            row.delivered_at = row.delivered_at ?? now;
            row.read_at = row.read_at ?? now;
        }
        if (next === 'failed')
            row.error_message = 'WhatsApp no pudo entregar el mensaje.';
        await this.messageRepo.save(row);
    }
    async enqueue(tenantId, userId, input) {
        const session = await this.sessions.requireConnected(tenantId);
        const phone = (0, whatsapp_util_1.normalizeWhatsappPhone)(input.phone, process.env.WHATSAPP_DEFAULT_COUNTRY_CODE?.trim() || undefined);
        if (!phone)
            throw new common_1.BadRequestException('El número de teléfono no es válido.');
        await this.assertDailyLimit(tenantId);
        const saved = await this.messageRepo.save(this.messageRepo.create({
            tenant_id: tenantId,
            session_name: session.session_name,
            to_phone: phone,
            type: input.type,
            body: input.body ?? null,
            file_name: input.file_name ?? null,
            file_mimetype: input.file_mimetype ?? null,
            status: 'queued',
            reference_type: input.reference_type ?? null,
            reference_id: input.reference_id ?? null,
            created_by: userId,
        }));
        if (input.file_url)
            this.files.set(saved.id, { url: input.file_url });
        else if (input.file_data)
            this.files.set(saved.id, { data: input.file_data });
        this.schedule(session.session_name, saved.id);
        return this.toView(saved);
    }
    async assertDailyLimit(tenantId) {
        const limit = Number(process.env.WHATSAPP_DAILY_LIMIT) || whatsapp_constants_1.DEFAULT_DAILY_LIMIT;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const sentToday = await this.messageRepo
            .createQueryBuilder('m')
            .where('m.tenant_id = :tenantId', { tenantId })
            .andWhere('m.created_at >= :since', { since: startOfDay })
            .andWhere("m.status <> 'failed'")
            .getCount();
        if (sentToday >= limit) {
            throw new common_1.HttpException(`Alcanzaste el límite diario de ${limit} mensajes de WhatsApp.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
    }
    schedule(sessionName, messageId) {
        const previous = this.chains.get(sessionName) ?? Promise.resolve();
        const next = previous.then(async () => {
            try {
                await this.process(messageId);
            }
            catch (error) {
                this.logger.error(`Fallo inesperado enviando ${messageId}: ${error?.message}`);
            }
            const min = Number(process.env.WHATSAPP_MIN_DELAY_MS) || whatsapp_constants_1.DEFAULT_MIN_DELAY_MS;
            const max = Number(process.env.WHATSAPP_MAX_DELAY_MS) || whatsapp_constants_1.DEFAULT_MAX_DELAY_MS;
            await sleep((0, whatsapp_util_1.randomDelay)(min, max));
        });
        this.chains.set(sessionName, next);
        void next.finally(() => {
            if (this.chains.get(sessionName) === next)
                this.chains.delete(sessionName);
        });
    }
    async process(messageId) {
        const claim = await this.messageRepo.update({ id: messageId, status: 'queued' }, { status: 'sending' });
        if (!claim.affected)
            return;
        const message = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!message)
            return;
        const session = await this.sessions.findBySessionName(message.session_name);
        if (!session || session.status !== 'WORKING') {
            await this.fail(message, whatsapp_errors_1.WHATSAPP_NOT_CONNECTED_MESSAGE);
            return;
        }
        try {
            const check = await this.waha.checkNumberExists(message.session_name, message.to_phone);
            if (!check?.numberExists) {
                await this.fail(message, 'El número no tiene WhatsApp.');
                return;
            }
            const chatId = check.chatId || `${message.to_phone}@c.us`;
            let result;
            if (message.type === 'file') {
                const source = this.files.get(message.id);
                if (!source) {
                    await this.fail(message, 'No se pudo recuperar el archivo. Vuelve a enviarlo.');
                    return;
                }
                const payload = {
                    ...source,
                    ...(message.file_name ? { filename: message.file_name } : {}),
                    ...(message.file_mimetype ? { mimetype: message.file_mimetype } : {}),
                };
                const asImage = (message.file_mimetype ?? '').startsWith('image/');
                result = asImage
                    ? await this.waha.sendImage(message.session_name, chatId, payload, message.body ?? undefined)
                    : await this.waha.sendFile(message.session_name, chatId, payload, message.body ?? undefined);
            }
            else {
                await this.simulateTyping(message.session_name, chatId, message.body?.length ?? 0);
                result = await this.waha.sendText(message.session_name, chatId, message.body ?? '');
            }
            await this.messageRepo.update({ id: message.id, status: 'sending' }, {
                status: 'sent',
                chat_id: chatId,
                waha_message_id: (0, whatsapp_util_1.extractWahaMessageId)(result),
                sent_at: new Date(),
                error_message: null,
            });
        }
        catch (error) {
            if (error instanceof waha_client_service_1.WahaError && (error.isNotFound || error.isSessionUnavailable)) {
                await this.sessions.markUnavailable(message.session_name, whatsapp_errors_1.WHATSAPP_NOT_CONNECTED_MESSAGE);
            }
            await this.fail(message, (0, whatsapp_errors_1.friendlyWahaMessage)(error));
        }
        finally {
            this.files.delete(message.id);
        }
    }
    async simulateTyping(session, chatId, length) {
        try {
            await this.waha.startTyping(session, chatId);
            await sleep(Math.min(4000, 800 + length * 25));
            await this.waha.stopTyping(session, chatId);
        }
        catch {
        }
    }
    async fail(message, reason) {
        await this.messageRepo.update({ id: message.id }, { status: 'failed', error_message: reason.slice(0, 500) });
    }
    async recover() {
        const staleBefore = new Date(Date.now() - STALE_SENDING_MS);
        await this.messageRepo
            .createQueryBuilder()
            .update(whatsapp_message_entity_1.WhatsappMessage)
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
                created_at: (0, typeorm_2.MoreThanOrEqual)(new Date(Date.now() - RECOVERY_WINDOW_MS)),
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
        if (pending.length)
            this.logger.log(`Reencoladas ${pending.length} mensajes de WhatsApp.`);
    }
    toView(row) {
        return {
            id: row.id,
            to_phone: row.to_phone,
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
};
exports.WhatsappMessageService = WhatsappMessageService;
exports.WhatsappMessageService = WhatsappMessageService = WhatsappMessageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(whatsapp_message_entity_1.WhatsappMessage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        whatsapp_session_service_1.WhatsappSessionService,
        waha_client_service_1.WahaClientService])
], WhatsappMessageService);
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=whatsapp-message.service.js.map