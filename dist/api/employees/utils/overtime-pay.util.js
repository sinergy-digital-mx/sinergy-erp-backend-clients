"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_OVERTIME_POLICY = void 0;
exports.todayInMexico = todayInMexico;
exports.normalizeClock = normalizeClock;
exports.calendarDayIndex = calendarDayIndex;
exports.isoFromDayIndex = isoFromDayIndex;
exports.shiftIsoDate = shiftIsoDate;
exports.weekRange = weekRange;
exports.minuteRange = minuteRange;
exports.rangesOverlap = rangesOverlap;
exports.resolveOvertimeSchedule = resolveOvertimeSchedule;
exports.allocateOvertimePay = allocateOvertimePay;
exports.round2 = round2;
exports.round4 = round4;
exports.DEFAULT_OVERTIME_POLICY = {
    workday_hours: 8,
    daily_double_hours: 3,
    weekly_double_hours: 9,
    double_multiplier: 2,
    excess_multiplier: 3,
};
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const CLOCK = /^([01]\d|2[0-3]):([0-5]\d)/;
function todayInMexico(reference = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(reference);
}
function normalizeClock(value) {
    if (!value)
        return null;
    const match = CLOCK.exec(String(value).trim());
    if (!match)
        return null;
    return `${match[1]}:${match[2]}`;
}
function calendarDayIndex(isoDate) {
    const match = ISO_DATE.exec(isoDate);
    if (!match)
        return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day) {
        return null;
    }
    return Math.round(date.getTime() / 86400000);
}
function isoFromDayIndex(index) {
    const date = new Date(index * 86400000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function shiftIsoDate(isoDate, days) {
    const index = calendarDayIndex(isoDate);
    if (index == null)
        return null;
    return isoFromDayIndex(index + days);
}
function weekRange(isoDate) {
    const index = calendarDayIndex(isoDate);
    if (index == null)
        return null;
    const date = new Date(index * 86400000);
    const weekday = date.getUTCDay();
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
    return {
        week_start: isoFromDayIndex(index + mondayOffset),
        week_end: isoFromDayIndex(index + mondayOffset + 6),
    };
}
function minuteRange(workDate, startTime, endTime) {
    const day = calendarDayIndex(workDate);
    const start = clockToMinutes(startTime);
    const end = clockToMinutes(endTime);
    if (day == null || start == null || end == null || start === end) {
        return null;
    }
    const startAbs = day * 1440 + start;
    const endAbs = (end > start ? day : day + 1) * 1440 + end;
    return [startAbs, endAbs];
}
function rangesOverlap(left, right) {
    return left[0] < right[1] && right[0] < left[1];
}
function resolveOvertimeSchedule(workDate, startTime, endTime, today = todayInMexico()) {
    const date = String(workDate ?? '').slice(0, 10);
    if (calendarDayIndex(date) == null) {
        return { ok: false, message: 'La fecha no es válida' };
    }
    if (date > today) {
        return { ok: false, message: 'La fecha no puede ser posterior a hoy' };
    }
    const start = normalizeClock(startTime);
    const end = normalizeClock(endTime);
    if (!start || !end) {
        return { ok: false, message: 'La hora debe tener formato HH:mm' };
    }
    if (start === end) {
        return {
            ok: false,
            message: 'La hora de término debe ser distinta a la de inicio',
        };
    }
    const range = minuteRange(date, start, end);
    if (!range) {
        return { ok: false, message: 'El horario no es válido' };
    }
    const requested = round2((range[1] - range[0]) / 60);
    if (requested <= 0 || requested > 24) {
        return { ok: false, message: 'El total de horas no es válido' };
    }
    return {
        ok: true,
        schedule: {
            work_date: date,
            start_time: start,
            end_time: end,
            requested_hours: requested,
        },
    };
}
function allocateOvertimePay(input) {
    const hours = round2(input.hours);
    const monthly = Number(input.monthlySalary);
    const workday = input.policy.workday_hours;
    const dailySalary = round2(monthly / 30);
    const hourly = round4(monthly / 30 / workday);
    const remainingDaily = Math.max(0, input.policy.daily_double_hours - input.priorDayHours);
    const remainingWeekly = Math.max(0, input.policy.weekly_double_hours - input.priorWeekHours);
    const doubleHours = round2(Math.min(hours, remainingDaily, remainingWeekly));
    const excessHours = round2(Math.max(0, hours - doubleHours));
    const amount = round2(doubleHours * hourly * input.policy.double_multiplier +
        excessHours * hourly * input.policy.excess_multiplier);
    return {
        hourly_rate: hourly,
        daily_salary: dailySalary,
        double_hours: doubleHours,
        excess_hours: excessHours,
        amount,
    };
}
function clockToMinutes(value) {
    const clock = normalizeClock(value);
    if (!clock)
        return null;
    const [hours, minutes] = clock.split(':').map(Number);
    return hours * 60 + minutes;
}
function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
function round4(value) {
    return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
//# sourceMappingURL=overtime-pay.util.js.map