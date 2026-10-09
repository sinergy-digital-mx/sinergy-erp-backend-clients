export interface CartaPorteCheck {
    ready: boolean;
    missing: string[];
}
export interface CartaPorteDriverInput {
    is_driver?: boolean | number | string | null;
    first_name?: string | null;
    last_name?: string | null;
    driver_license_number?: string | null;
    driver_rfc?: string | null;
}
export interface CartaPorteTruckInput {
    placa?: string | null;
    anio?: string | null;
    permiso_sct?: string | null;
    numero_permiso_sct?: string | null;
    tipo_auto_transporte?: string | null;
    peso_bruto_vehicular?: number | string | null;
    aseguradora_rc?: string | null;
    poliza_rc?: string | null;
    subtipo_remolque1?: string | null;
    placa_remolque1?: string | null;
}
export declare function isDriverFlag(value: CartaPorteDriverInput['is_driver']): boolean;
export declare function assessDriver(input: CartaPorteDriverInput | null | undefined): CartaPorteCheck;
export declare function assessTruck(input: CartaPorteTruckInput | null | undefined): CartaPorteCheck;
export declare function normalizeRfc(value: string | null | undefined): string;
export declare function normalizeLicense(value: string | null | undefined): string;
export declare function isValidRfc(value: string | null | undefined): boolean;
export declare function buildIdCcp(): string;
export declare function satStateCode(value: string | null | undefined): string | null;
export declare function postalCode(value: string | null | undefined): string | null;
export declare function plateCode(value: string | null | undefined): string;
export declare function escapeXml(value: string): string;
export declare function kg(value: number): string;
export declare function money0(): string;
export declare function decorateShippingCartaPorte<T extends {
    driver?: CartaPorteDriverInput | null;
    truck?: CartaPorteTruckInput | null;
}>(shipping: T): T;
export declare function splitWeightKg(totalKg: number, quantities: number[]): number[];
