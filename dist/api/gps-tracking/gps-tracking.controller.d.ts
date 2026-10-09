import { TenantContextService } from '../rbac/services/tenant-context.service';
import { CreateGpsTrackingConfigurationDto, TestGpsTrackingConfigurationDto, UpdateGpsTrackingConfigurationDto } from './dto/gps-tracking-configuration.dto';
import { GpsTrackingService } from './services/gps-tracking.service';
export declare class GpsTrackingController {
    private readonly service;
    private readonly tenantContext;
    constructor(service: GpsTrackingService, tenantContext: TenantContextService);
    positions(truckId?: string): Promise<{
        ok: boolean;
        configured: boolean;
        message: string;
        units: import("./services/gps-tracking.service").GpsFleetUnit[];
    } | {
        ok: boolean;
        configured: boolean;
        message: null;
        units: import("./services/gps-tracking.service").GpsFleetUnit[];
    }>;
    units(): Promise<{
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
    list(): Promise<import("./services/gps-tracking.service").GpsTrackingConfigurationView[]>;
    create(dto: CreateGpsTrackingConfigurationDto): Promise<import("./services/gps-tracking.service").GpsTrackingConfigurationView>;
    active(): Promise<import("./services/gps-tracking.service").GpsTrackingConfigurationView>;
    test(dto: TestGpsTrackingConfigurationDto): Promise<{
        ok: boolean;
        message: string;
        unit_count: number;
    }>;
    update(id: string, dto: UpdateGpsTrackingConfigurationDto): Promise<import("./services/gps-tracking.service").GpsTrackingConfigurationView>;
    remove(id: string): Promise<void>;
    activate(id: string): Promise<import("./services/gps-tracking.service").GpsTrackingConfigurationView>;
    private tenantId;
    private userId;
}
