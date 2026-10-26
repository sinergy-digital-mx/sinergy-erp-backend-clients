"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarYearInMexico = calendarYearInMexico;
exports.sickLeaveDaysInYear = sickLeaveDaysInYear;
exports.summarizeSickLeaveYear = summarizeSickLeaveYear;
const mexican_labor_law_1 = require("./mexican-labor-law");
function calendarYearInMexico(reference = new Date()) {
    const year = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
    }).format(reference);
    return Number(year);
}
function sickLeaveDaysInYear(request, year) {
    const start = toIsoDate(request.start_date);
    const end = toIsoDate(request.end_date);
    if (!start || !end || end < start) {
        return 0;
    }
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    if (end < yearStart || start > yearEnd) {
        return 0;
    }
    if (start >= yearStart && end <= yearEnd) {
        const stored = Number(request.days);
        return Number.isFinite(stored) && stored > 0 ? round1(stored) : 0;
    }
    const from = start > yearStart ? start : yearStart;
    const to = end < yearEnd ? end : yearEnd;
    return (0, mexican_labor_law_1.inclusiveDayCount)(from, to);
}
function summarizeSickLeaveYear(requests, year) {
    let approved = 0;
    let pending = 0;
    let requestCount = 0;
    for (const request of requests) {
        if (request.status !== 'approved' && request.status !== 'pending') {
            continue;
        }
        const days = sickLeaveDaysInYear(request, year);
        if (days <= 0) {
            continue;
        }
        requestCount += 1;
        if (request.status === 'approved') {
            approved += days;
        }
        else {
            pending += days;
        }
    }
    return {
        year,
        approved_days: round1(approved),
        pending_days: round1(pending),
        request_count: requestCount,
    };
}
function toIsoDate(value) {
    if (!value) {
        return '';
    }
    if (typeof value === 'string') {
        return value.slice(0, 10);
    }
    const date = (0, mexican_labor_law_1.parseCalendarDate)(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}
function round1(value) {
    return Math.round(value * 10) / 10;
}
//# sourceMappingURL=sick-leave-year.util.js.map