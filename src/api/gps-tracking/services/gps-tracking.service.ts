import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GpsTrackingConfiguration } from '../../../entities/gps-tracking/gps-tracking-configuration.entity';
import { Truck } from '../../../entities/logistics/truck.entity';
import { ACTIVE_SHIPPING_STATUSES, Shipping } from '../../../entities/logistics/shipping.entity';
import {
  CreateGpsTrackingConfigurationDto,
  TestGpsTrackingConfigurationDto,
  UpdateGpsTrackingConfigurationDto,
} from '../dto/gps-tracking-configuration.dto';
import { GpsSecretCipherService } from './gps-secret-cipher.service';
import { GpsProviderError, GpsTrackingClientService } from './gps-tracking-client.service';
import { matchTruckToUnit, NormalizedGpsUnit } from '../utils/gps-tracking.util';

export interface GpsTrackingConfigurationView {
  id: string;
  name: string;
  username: string;
  is_active: boolean;
  is_valid: boolean;
  has_password: boolean;
  last_test_result: Record<string, unknown> | null;
  last_test_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface GpsFleetUnit extends NormalizedGpsUnit {
  truck_id: string | null;
  truck_name: string | null;
  truck_placa: string | null;
  active_shipping_id: string | null;
  active_shipping_status: string | null;
}

type ReadyClient =
  | { ok: true; configId: string; token: { userIdGuid: string; sessionId: string } }
  | { ok: false; configured: boolean; message: string };

@Injectable()
export class GpsTrackingService {
  constructor(
    @InjectRepository(GpsTrackingConfiguration)
    private readonly configRepo: Repository<GpsTrackingConfiguration>,
    @InjectRepository(Truck)
    private readonly truckRepo: Repository<Truck>,
    @InjectRepository(Shipping)
    private readonly shippingRepo: Repository<Shipping>,
    private readonly cipher: GpsSecretCipherService,
    private readonly client: GpsTrackingClientService,
  ) {}

  async list(tenantId: string): Promise<GpsTrackingConfigurationView[]> {
    const rows = await this.configRepo.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
    return rows.map((row) => this.toView(row));
  }

  async findActive(tenantId: string): Promise<GpsTrackingConfigurationView> {
    const row = await this.findActiveRow(tenantId);
    if (!row) {
      throw new NotFoundException('No hay una configuración de rastreo GPS activa.');
    }
    return this.toView(row);
  }

  async create(
    tenantId: string,
    dto: CreateGpsTrackingConfigurationDto,
    userId: string,
  ): Promise<GpsTrackingConfigurationView> {
    await this.assertNameAvailable(tenantId, dto.name);
    const secret = this.cipher.encrypt(dto.password.trim());
    const existing = await this.configRepo.count({ where: { tenant_id: tenantId } });

    const saved = await this.configRepo.save(
      this.configRepo.create({
        tenant_id: tenantId,
        name: dto.name.trim(),
        username: dto.username.trim(),
        encrypted_password: secret.encryptedValue,
        password_iv: secret.iv,
        is_active: existing === 0,
        is_valid: false,
        created_by: userId,
        updated_by: userId,
      }),
    );
    return this.toView(saved);
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateGpsTrackingConfigurationDto,
    userId: string,
  ): Promise<GpsTrackingConfigurationView> {
    const row = await this.getOrFail(id, tenantId);

    if (dto.name && dto.name.trim() !== row.name) {
      await this.assertNameAvailable(tenantId, dto.name, id);
      row.name = dto.name.trim();
    }
    if (dto.username) row.username = dto.username.trim();
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

  async remove(id: string, tenantId: string): Promise<void> {
    const row = await this.getOrFail(id, tenantId);
    this.client.invalidate(row.id);
    await this.configRepo.remove(row);
  }

  async activate(id: string, tenantId: string, userId: string): Promise<GpsTrackingConfigurationView> {
    const row = await this.getOrFail(id, tenantId);
    await this.configRepo.update({ tenant_id: tenantId }, { is_active: false, updated_by: userId });
    row.is_active = true;
    row.updated_by = userId;
    const saved = await this.configRepo.save(row);
    return this.toView(saved);
  }

  async test(
    tenantId: string,
    dto: TestGpsTrackingConfigurationDto,
  ): Promise<{ ok: boolean; message: string; unit_count: number }> {
    const stored = dto.configuration_id
      ? await this.getOrFail(dto.configuration_id, tenantId)
      : null;
    const username = dto.username?.trim() || stored?.username;
    const password =
      dto.password?.trim() ||
      (stored ? this.cipher.decrypt(stored.encrypted_password, stored.password_iv) : '');

    if (!username || !password) {
      throw new BadRequestException('Indica usuario y contraseña para probar la conexión.');
    }

    try {
      const token = await this.client.authenticate(username, password);
      const units = await this.client.latestPositions(token);
      const result = {
        ok: true,
        message:
          units.length > 0
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
    } catch (error) {
      const message =
        error instanceof GpsProviderError
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

  async units(tenantId: string) {
    const ready = await this.readyClient(tenantId);
    if (!ready.ok) return { ok: false, configured: ready.configured, message: ready.message, units: [] };

    try {
      const [catalog, positions] = await Promise.all([
        this.client.listUnits(ready.token),
        this.client.latestPositions(ready.token),
      ]);
      const byUid = new Map<
        string,
        { uid: string; name: string; imei: string | null; has_position: boolean }
      >();
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
    } catch (error) {
      this.client.invalidate(ready.configId);
      return {
        ok: false,
        configured: true,
        message: error instanceof GpsProviderError ? error.message : 'No se pudo consultar 3D Tracking.',
        units: [],
      };
    }
  }

  async positions(tenantId: string, truckId?: string) {
    const ready = await this.readyClient(tenantId);
    if (!ready.ok) {
      return { ok: false, configured: ready.configured, message: ready.message, units: [] as GpsFleetUnit[] };
    }

    try {
      const rawUnits = await this.client.latestPositions(ready.token);
      const trucks = await this.truckRepo.find({ where: { tenant_id: tenantId } });
      const active = await this.shippingRepo.find({
        where: { tenant_id: tenantId, status: In(ACTIVE_SHIPPING_STATUSES) },
      });
      const busyByTruck = new Map(active.map((row) => [row.truck_id, row]));

      let units = rawUnits.map((unit) => this.withTruck(unit, trucks, busyByTruck));
      if (truckId) units = units.filter((unit) => unit.truck_id === truckId);
      units.sort((a, b) => a.name.localeCompare(b.name, 'es'));
      return { ok: true, configured: true, message: null, units };
    } catch (error) {
      this.client.invalidate(ready.configId);
      return {
        ok: false,
        configured: true,
        message: error instanceof GpsProviderError ? error.message : 'No se pudo consultar 3D Tracking.',
        units: [] as GpsFleetUnit[],
      };
    }
  }

  private withTruck(
    unit: NormalizedGpsUnit,
    trucks: Truck[],
    busyByTruck: Map<string, Shipping>,
  ): GpsFleetUnit {
    const truck = matchTruckToUnit(unit, trucks);
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

  private async readyClient(tenantId: string): Promise<ReadyClient> {
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
    } catch (error) {
      this.client.invalidate(config.id);
      return {
        ok: false,
        configured: true,
        message: error instanceof GpsProviderError ? error.message : 'No se pudo consultar 3D Tracking.',
      };
    }
  }

  private async findActiveRow(tenantId: string): Promise<GpsTrackingConfiguration | null> {
    return this.configRepo.findOne({ where: { tenant_id: tenantId, is_active: true } });
  }

  private async getOrFail(id: string, tenantId: string): Promise<GpsTrackingConfiguration> {
    const row = await this.configRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!row) throw new NotFoundException('Configuración de rastreo GPS no encontrada.');
    return row;
  }

  private async assertNameAvailable(tenantId: string, name: string, excludeId?: string): Promise<void> {
    const existing = await this.configRepo.findOne({
      where: { tenant_id: tenantId, name: name.trim() },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Ya existe una configuración de rastreo con ese nombre.');
    }
  }

  private toView(row: GpsTrackingConfiguration): GpsTrackingConfigurationView {
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
}
