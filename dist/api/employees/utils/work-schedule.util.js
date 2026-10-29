"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORK_WEEKDAY_LABELS = exports.WORK_WEEKDAYS = void 0;
exports.hoursBetweenClocks = hoursBetweenClocks;
exports.draftWorkSchedule = draftWorkSchedule;
exports.presentWorkSchedule = presentWorkSchedule;
exports.resolveWorkSchedule = resolveWorkSchedule;
const overtime_pay_util_1 = require("./overtime-pay.util");
exports.WORK_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
exports.WORK_WEEKDAY_LABELS = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo',
};
function clockMinutes(value) {
    const clock = (0, overtime_pay_util_1.normalizeClock)(value);
    if (!clock)
        return null;
    const [hours, minutes] = clock.split(':').map(Number);
    return hours * 60 + minutes;
}
function hoursBetweenClocks(startTime, endTime) {
    const start = clockMinutes(startTime);
    const end = clockMinutes(endTime);
    if (start == null || end == null || start === end) {
        return null;
    }
    const minutes = end > start ? end - start : 1440 - start + end;
    return (0, overtime_pay_util_1.round2)(minutes / 60);
}
function draftWorkSchedule() {
    const days = exports.WORK_WEEKDAYS.map((weekday) => {
        const isWorkday = weekday <= 5;
        return buildDay(weekday, isWorkday, isWorkday ? '09:00' : null, isWorkday ? '18:00' : null);
    });
    return {
        days,
        weekly_hours: sumHours(days),
        notes: null,
    };
}
function presentWorkSchedule(raw) {
    if (!raw || typeof raw !== 'object') {
        return null;
    }
    const resolved = resolveWorkSchedule(raw);
    return resolved.ok ? resolved.schedule : null;
}
function resolveWorkSchedule(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const incoming = Array.isArray(source['days']) ? source['days'] : [];
    const byWeekday = new Map();
    for (const item of incoming) {
        if (!item || typeof item !== 'object') {
            continue;
        }
        const row = item;
        const weekday = Number(row['weekday']);
        if (!exports.WORK_WEEKDAYS.includes(weekday)) {
            return { ok: false, message: 'El día de la semana no es válido.' };
        }
        if (byWeekday.has(weekday)) {
            return { ok: false, message: 'Hay un día repetido en el horario.' };
        }
        byWeekday.set(weekday, {
            weekday,
            is_workday: row['is_workday'] === true || row['is_workday'] === 1,
            start_time: row['start_time'] == null ? null : String(row['start_time']),
            end_time: row['end_time'] == null ? null : String(row['end_time']),
        });
    }
    const days = [];
    for (const weekday of exports.WORK_WEEKDAYS) {
        const row = byWeekday.get(weekday);
        const isWorkday = row?.is_workday === true;
        if (isWorkday) {
            const start = (0, overtime_pay_util_1.normalizeClock)(row?.start_time);
            const end = (0, overtime_pay_util_1.normalizeClock)(row?.end_time);
            if (!start || !end) {
                return {
                    ok: false,
                    message: `Indica entrada y salida para ${exports.WORK_WEEKDAY_LABELS[weekday]}.`,
                };
            }
            const hours = hoursBetweenClocks(start, end);
            if (hours == null) {
                return {
                    ok: false,
                    message: `La entrada y la salida de ${exports.WORK_WEEKDAY_LABELS[weekday]} no pueden ser iguales.`,
                };
            }
            days.push(buildDay(weekday, true, start, end, hours));
        }
        else {
            days.push(buildDay(weekday, false, null, null, 0));
        }
    }
    if (!days.some((day) => day.is_workday)) {
        return { ok: false, message: 'Marca al menos un día laboral.' };
    }
    const notesRaw = source['notes'];
    const notes = notesRaw == null || notesRaw === ''
        ? null
        : String(notesRaw).trim() || null;
    if (notes && notes.length > 255) {
        return { ok: false, message: 'Las notas del horario admiten máximo 255 caracteres.' };
    }
    return {
        ok: true,
        schedule: {
            days,
            weekly_hours: sumHours(days),
            notes,
        },
    };
}
function buildDay(weekday, isWorkday, startTime, endTime, hours) {
    return {
        weekday,
        is_workday: isWorkday,
        start_time: startTime,
        end_time: endTime,
        hours: hours ?? (isWorkday ? hoursBetweenClocks(startTime, endTime) ?? 0 : 0),
    };
}
function sumHours(days) {
    return (0, overtime_pay_util_1.round2)(days.reduce((total, day) => total + (day.hours || 0), 0));
}
//# sourceMappingURL=work-schedule.util.js.map