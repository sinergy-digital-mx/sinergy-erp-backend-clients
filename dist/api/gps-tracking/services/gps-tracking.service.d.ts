import { Repository } from 'typeorm';
import { GpsTrackingConfiguration } from '../../../entities/gps-tracking/gps-tracking-configuration.entity';
import { Truck } from '../../../entities/logistics/truck.entity';
import { Shipping } from '../../../entities/logistics/shipping.entity';
import { CreateGpsTrackingConfigurationDto, TestGpsTrackingConfigurationDto, UpdateGpsTrackingConfigurationDto } from '../dto/gps-tracking-configuration.dto';
import { GpsSecretCipherService } from './gps-secret-cipher.service';
import { GpsTrackingClientService } from './gps-tracking-client.service';
import { NormalizedGpsUnit } from '../utils/gps-tracking.util';
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
export declare class GpsTrackingService {
    private readonly configRepo;
    private readonly truckRepo;
    private readonly shippingRepo;
    private readonly cipher;
    private readonly client;
    constructor(configRepo: Repository<GpsTrackingConfiguration>, truckRepo: Repository<Truck>, shippingRepo: Repository<Shipping>, cipher: GpsSecretCipherService, client: GpsTrackingClientService);
    list(tenantId: string): Promise<GpsTrackingConfigurationView[]>;
    findActive(tenantId: string): Promise<GpsTrackingConfigurationView>;
    create(tenantId: string, dto: CreateGpsTrackingConfigurationDto, userId: string): Promise<GpsTrackingConfigurationView>;
    update(id: string, tenantId: string, dto: UpdateGpsTrackingConfigurationDto, userId: string): Promise<GpsTrackingConfigurationView>;
    remove(id: string, tenantId: string): Promise<void>;
    activate(id: string, tenantId: string, userId: string): Promise<GpsTrackingConfigurationView>;
    test(tenantId: string, dto: TestGpsTrackingConfigurationDto): Promise<{
        ok: boolean;
        message: string;
        unit_count: number;
    }>;
    units(tenantId: string): Promise<{
        ok: boolean;
        configured: boolean;
        message: string;
        units: never[];
    } | {
        ok: boolean;
        configured: boolean;
        message: null;
        units: {
            uid: string;
            name: string;
            imei: string | null;
            has_position: boolean;
        }[];
    }>;
    positions(tenantId: string, truckId?: string): Promise<{
        ok: boolean;
        configured: boolean;
        message: string;
        units: GpsFleetUnit[];
    } | {
        ok: boolean;
        configured: boolean;
        message: null;
        units: GpsFleetUnit[];
    }>;
    private withTruck;
    private readyClient;
    private findActiveRow;
    private getOrFail;
    private assertNameAvailable;
    private toView;
}
