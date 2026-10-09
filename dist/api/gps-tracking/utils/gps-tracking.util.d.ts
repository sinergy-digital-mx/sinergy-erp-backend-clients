import { Truck } from '../../../entities/logistics/truck.entity';
export interface NormalizedGpsUnit {
    uid: string;
    name: string;
    imei: string | null;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    speed: number | null;
    speed_measure: string | null;
    heading: number | null;
    ignition: string | null;
    engine_status: string | null;
    odometer: number | null;
    reported_at: string | null;
    driver_name: string | null;
}
export declare function formatTrackingSince(date: Date): string;
export declare function normalizePlate(value: string | null | undefined): string;
export declare function platesMatch(left: string | null | undefined, right: string | null | undefined): boolean;
export declare function normalizeGpsUnit(raw: unknown): NormalizedGpsUnit | null;
export declare function matchTruckToUnit(unit: Pick<NormalizedGpsUnit, 'uid' | 'name'>, trucks: Truck[]): Truck | null;
export declare function translateGpsProviderError(code: string | undefined, providerMessage: string | undefined): string;
