export interface GeoPoint {
    latitude: number | null | undefined;
    longitude: number | null | undefined;
}
export declare function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number;
export declare function hasValidGps(point: GeoPoint | null | undefined): boolean;
export declare function routeDistanceKm(points: GeoPoint[]): number | null;
export declare function segmentDistanceKm(previous: GeoPoint | null | undefined, current: GeoPoint | null | undefined): number | null;
