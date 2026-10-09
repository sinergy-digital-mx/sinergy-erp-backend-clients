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
exports.GpsTrackingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const gps_tracking_configuration_entity_1 = require("../../../entities/gps-tracking/gps-tracking-configuration.entity");
const truck_entity_1 = require("../../../entities/logistics/truck.entity");
const shipping_entity_1 = require("../../../entities/logistics/shipping.entity");
const gps_secret_cipher_service_1 = require("./gps-secret-cipher.service");
const gps_tracking_client_service_1 = require("./gps-tracking-client.service");
const gps_tracking_util_1 = require("../utils/gps-tracking.util");
let GpsTrackingService = class GpsTrackingService {
    configRepo;
    truckRepo;
    shippingRepo;
    cipher;
    client;
    constructor(configRepo, truckRepo, shippingRepo, cipher, client) {
        this.configRepo = configRepo;
        this.truckRepo = truckRepo;
        this.shippingRepo = shippingRepo;
        this.cipher = cipher;
        this.client = client;
    }
    async list(tenantId) {
        const rows = await this.configRepo.find({
            where: { tenant_id: tenantId },
            order: { created_at: 'DESC' },
        });
        return rows.map((row) => this.toView(row));
    }
    async findActive(tenantId) {
        const row = await this.findActiveRow(tenantId);
        if (!row) {
            throw new common_1.NotFoundException('No hay una configuración de rastreo GPS activa.');
        }
        return this.toView(row);
    }
    async create(tenantId, dto, userId) {
        await this.assertNameAvailable(tenantId, dto.name);
        const secret = this.cipher.encrypt(dto.password.trim());
        const existing = await this.configRepo.count({ where: { tenant_id: tenantId } });
        const saved = await this.configRepo.save(this.configRepo.create({
            tenant_id: tenantId,
            name: dto.name.trim(),
            username: dto.username.trim(),
            encrypted_password: secret.encryptedValue,
            password_iv: secret.iv,
            is_active: existing === 0,
            is_valid: false,
            created_by: userId,
            updated_by: userId,
        }));
        return this.toView(saved);
    }
    async update(id, tenantId, dto, userId) {
        const row = await this.getOrFail(id, tenantId);
        if (dto.name && dto.name.trim() !== row.name) {
            await this.assertNameAvailable(tenantId, dto.name, id);
            row.name = dto.name.trim();
        }
        if (dto.username)
            row.username = dto.username.trim();
        if (dto.password) {
            const secret = this.cipher.encrypt(dto.password.trim());
            row.encrypted_password = secret.encryptedValue;
            row.password_iv = secret.iv;
            row.is_valid = false;
            this.client.invalidate(row.id);
        }
        row.updated_by = userId;
        const saved = await this.configRepo.save(row);
        return this.toView(saved);
    }
    async remove(id, tenantId) {
        const row = await this.getOrFail(id, tenantId);
        this.client.invalidate(row.id);
        await this.configRepo.remove(row);
    }
    async activate(id, tenantId, userId) {
        const row = await this.getOrFail(id, tenantId);
        await this.configRepo.update({ tenant_id: tenantId }, { is_active: false, updated_by: userId });
        row.is_active = true;
        row.updated_by = userId;
        const saved = await this.configRepo.save(row);
        return this.toView(saved);
    }
    async test(tenantId, dto) {
        const stored = dto.configuration_id
            ? await this.getOrFail(dto.configuration_id, tenantId)
            : null;
        const username = dto.username?.trim() || stored?.username;
        const password = dto.password?.trim() ||
            (stored ? this.cipher.decrypt(stored.encrypted_password, stored.password_iv) : '');
        if (!username || !password) {
            throw new common_1.BadRequestException('Indica usuario y contraseña para probar la conexión.');
        }
        try {
            const token = await this.client.authenticate(username, password);
            const units = await this.client.latestPositions(token);
            const result = {
                ok: true,
                message: units.length > 0
                    ? `Conexión correcta. ${units.length} unidad${units.length === 1 ? '' : 'es'} con posición.`
                    : 'Conexión correcta. 3D Tracking todavía no tiene unidades con posición. Cuando registren la flota con su placa, aparecerán aquí.',
                unit_count: units.length,
            };
            if (stored) {
                stored.is_valid = true;
                stored.last_test_result = { ...result, tested_at: new Date().toISOString() };
                stored.last_test_at = new Date();
                await this.configRepo.save(stored);
                this.client.invalidate(stored.id);
            }
            return result;
        }
        catch (error) {
            const message = error instanceof gps_tracking_client_service_1.GpsProviderError
                ? error.message
                : 'No se pudo consultar 3D Tracking.';
            if (stored) {
                stored.is_valid = false;
                stored.last_test_result = {
                    ok: false,
                    message,
                    unit_count: 0,
                    tested_at: new Date().toISOString(),
                };
                stored.last_test_at = new Date();
                await this.configRepo.save(stored);
                this.client.invalidate(stored.id);
            }
            return { ok: false, message, unit_count: 0 };
        }
    }
    async units(tenantId) {
        const ready = await this.readyClient(tenantId);
        if (!ready.ok)
            return { ok: false, configured: ready.configured, message: ready.message, units: [] };
        try {
            const [catalog, positions] = await Promise.all([
                this.client.listUnits(ready.token),
                this.client.latestPositions(ready.token),
            ]);
            const byUid = new Map();
            for (const row of catalog) {
                byUid.set(row.uid, { ...row, has_position: false });
            }
            for (const row of positions) {
                const current = byUid.get(row.uid);
                byUid.set(row.uid, {
                    uid: row.uid,
                    name: row.name || current?.name || row.uid,
                    imei: row.imei || current?.imei || null,
                    has_position: row.latitude != null && row.longitude != null,
                });
            }
            const units = [...byUid.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
            return { ok: true, configured: true, message: null, units };
        }
        catch (error) {
            this.client.invalidate(ready.configId);
            return {
                ok: false,
                configured: true,
                message: error instanceof gps_tracking_client_service_1.GpsProviderError ? error.message : 'No se pudo consultar 3D Tracking.',
                units: [],
            };
        }
    }
    async positions(tenantId, truckId) {
        const ready = await this.readyClient(tenantId);
        if (!ready.ok) {
            return { ok: false, configured: ready.configured, message: ready.message, units: [] };
        }
        try {
            const rawUnits = await this.client.latestPositions(ready.token);
            const trucks = await this.truckRepo.find({ where: { tenant_id: tenantId } });
            const active = await this.shippingRepo.find({
                where: { tenant_id: tenantId, status: (0, typeorm_2.In)(shipping_entity_1.ACTIVE_SHIPPING_STATUSES) },
            });
            const busyByTruck = new Map(active.map((row) => [row.truck_id, row]));
            let units = rawUnits.map((unit) => this.withTruck(unit, trucks, busyByTruck));
            if (truckId)
                units = units.filter((unit) => unit.truck_id === truckId);
            units.sort((a, b) => a.name.localeCompare(b.name, 'es'));
            return { ok: true, configured: true, message: null, units };
        }
        catch (error) {
            this.client.invalidate(ready.configId);
            return {
                ok: false,
                configured: true,
                message: error instanceof gps_tracking_client_service_1.GpsProviderError ? error.message : 'No se pudo consultar 3D Tracking.',
                units: [],
            };
        }
    }
    withTruck(unit, trucks, busyByTruck) {
        const truck = (0, gps_tracking_util_1.matchTruckToUnit)(unit, trucks);
        const shipping = truck ? busyByTruck.get(truck.id) : undefined;
        return {
            ...unit,
            truck_id: truck?.id ?? null,
            truck_name: truck?.name ?? null,
            truck_placa: truck?.placa ?? null,
            active_shipping_id: shipping?.id ?? null,
            active_shipping_status: shipping?.status ?? null,
        };
    }
    async readyClient(tenantId) {
        const config = await this.findActiveRow(tenantId);
        if (!config) {
            return {
                ok: false,
                configured: false,
                message: 'Configura el rastreo GPS en Configuración del sistema.',
            };
        }
        try {
            const password = this.cipher.decrypt(config.encrypted_password, config.password_iv);
            const token = await this.client.session(config.id, config.username, password);
            return { ok: true, configId: config.id, token };
        }
        catch (error) {
            this.client.invalidate(config.id);
            return {
                ok: false,
                configured: true,
                message: error instanceof gps_tracking_client_service_1.GpsProviderError ? error.message : 'No se pudo consultar 3D Tracking.',
            };
        }
    }
    async findActiveRow(tenantId) {
        return this.configRepo.findOne({ where: { tenant_id: tenantId, is_active: true } });
    }
    async getOrFail(id, tenantId) {
        const row = await this.configRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!row)
            throw new common_1.NotFoundException('Configuración de rastreo GPS no encontrada.');
        return row;
    }
    async assertNameAvailable(tenantId, name, excludeId) {
        const existing = await this.configRepo.findOne({
            where: { tenant_id: tenantId, name: name.trim() },
        });
        if (existing && existing.id !== excludeId) {
            throw new common_1.ConflictException('Ya existe una configuración de rastreo con ese nombre.');
        }
    }
    toView(row) {
        return {
            id: row.id,
            name: row.name,
            username: row.username,
            is_active: row.is_active,
            is_valid: row.is_valid,
            has_password: !!row.encrypted_password,
            last_test_result: row.last_test_result,
            last_test_at: row.last_test_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
};
exports.GpsTrackingService = GpsTrackingService;
exports.GpsTrackingService = GpsTrackingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gps_tracking_configuration_entity_1.GpsTrackingConfiguration)),
    __param(1, (0, typeorm_1.InjectRepository)(truck_entity_1.Truck)),
    __param(2, (0, typeorm_1.InjectRepository)(shipping_entity_1.Shipping)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        gps_secret_cipher_service_1.GpsSecretCipherService,
        gps_tracking_client_service_1.GpsTrackingClientService])
], GpsTrackingService);
//# sourceMappingURL=gps-tracking.service.js.map