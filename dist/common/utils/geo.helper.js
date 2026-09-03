"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineKm = haversineKm;
exports.hasValidGps = hasValidGps;
exports.routeDistanceKm = routeDistanceKm;
exports.segmentDistanceKm = segmentDistanceKm;
const EARTH_RADIUS_KM = 6371;
function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
}
function haversineKm(lat1, lon1, lat2, lon2) {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}
function hasValidGps(point) {
    if (!point)
        return false;
    const { latitude, longitude } = point;
    return (latitude != null &&
        longitude != null &&
        !Number.isNaN(Number(latitude)) &&
        !Number.isNaN(Number(longitude)));
}
function routeDistanceKm(points) {
    const valid = points.filter(hasValidGps).map((p) => ({
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
    }));
    if (valid.length < 2)
        return null;
    let total = 0;
    for (let i = 1; i < valid.length; i++) {
        total += haversineKm(valid[i - 1].latitude, valid[i - 1].longitude, valid[i].latitude, valid[i].longitude);
    }
    return Math.round(total * 100) / 100;
}
function segmentDistanceKm(previous, current) {
    if (!hasValidGps(previous) || !hasValidGps(current))
        return null;
    const km = haversineKm(Number(previous.latitude), Number(previous.longitude), Number(current.latitude), Number(current.longitude));
    return Math.round(km * 100) / 100;
}
//# sourceMappingURL=geo.helper.js.map