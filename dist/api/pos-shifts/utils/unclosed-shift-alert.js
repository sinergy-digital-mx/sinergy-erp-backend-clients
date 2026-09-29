"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayDateString = getTodayDateString;
exports.toDateOnlyString = toDateOnlyString;
exports.resolvePosCalendarRange = resolvePosCalendarRange;
exports.isPreviousDayOpenShift = isPreviousDayOpenShift;
exports.buildUnclosedShiftAlert = buildUnclosedShiftAlert;
const POS_CALENDAR_TIMEZONE = 'America/Mexico_City';
function getTodayDateString(now = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: POS_CALENDAR_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now);
}
function toDateOnlyString(value) {
    const raw = value instanceof Date ? value.toISOString() : String(value);
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw.trim());
    return match ? match[1] : raw.slice(0, 10);
}
function resolvePosCalendarRange(period, dateFrom, dateTo, now = new Date()) {
    const today = getTodayDateString(now);
    if (period === 'today') {
        return { from: today, to: today };
    }
    if (period === 'range') {
        return {
            from: String(dateFrom || today).slice(0, 10),
            to: String(dateTo || today).slice(0, 10),
        };
    }
    if (period === 'week') {
        const [year, month, day] = today.split('-').map(Number);
        const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
        const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
        return { from: addUtcDays(today, -daysFromMonday), to: today };
    }
    return { from: `${today.slice(0, 8)}01`, to: today };
}
function addUtcDays(isoDate, days) {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
function isPreviousDayOpenShift(shiftDate, today = getTodayDateString()) {
    return toDateOnlyString(shiftDate) < today;
}
function diffDays(fromDate, toDate) {
    const from = Date.parse(`${fromDate}T00:00:00.000Z`);
    const to = Date.parse(`${toDate}T00:00:00.000Z`);
    return Math.max(1, Math.round((to - from) / 86_400_000));
}
function buildUnclosedShiftAlert(shift, today = getTodayDateString()) {
    if (!shift || !isPreviousDayOpenShift(shift.shift_date, today)) {
        return null;
    }
    const shiftDate = toDateOnlyString(shift.shift_date);
    const daysOpen = diffDays(shiftDate, today);
    const isYesterday = daysOpen === 1;
    return {
        active: true,
        daily_shift_id: shift.id,
        shift_date: shiftDate,
        today,
        days_open: daysOpen,
        title: 'Corte del día anterior sin cerrar',
        message: isYesterday
            ? `No se cerró el corte de ayer (${shiftDate}). Es necesario cerrarlo para continuar.`
            : `Quedó un corte abierto del ${shiftDate} sin cerrar. Es necesario cerrarlo para continuar.`,
        severity: 'blocking',
    };
}
//# sourceMappingURL=unclosed-shift-alert.js.map