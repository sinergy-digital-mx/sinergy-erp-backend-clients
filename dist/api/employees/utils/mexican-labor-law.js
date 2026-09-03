"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VACATION_PREMIUM_RATE = exports.MIN_AGUINALDO_DAYS = void 0;
exports.completedYearsOfService = completedYearsOfService;
exports.vacationDaysForYears = vacationDaysForYears;
exports.currentAnniversaryStart = currentAnniversaryStart;
exports.buildVacationSummary = buildVacationSummary;
exports.buildPayrollSummary = buildPayrollSummary;
exports.parseCalendarDate = parseCalendarDate;
exports.inclusiveDayCount = inclusiveDayCount;
exports.inclusiveBusinessDayCount = inclusiveBusinessDayCount;
exports.resolveLeaveDays = resolveLeaveDays;
exports.MIN_AGUINALDO_DAYS = 15;
exports.VACATION_PREMIUM_RATE = 0.25;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
function completedYearsOfService(hireDate, reference = new Date()) {
    if (!hireDate)
        return 0;
    const hire = parseCalendarDate(hireDate);
    if (isNaN(hire.getTime()))
        return 0;
    let years = reference.getFullYear() - hire.getFullYear();
    const anniversaryThisYear = new Date(reference.getFullYear(), hire.getMonth(), hire.getDate());
    if (reference < anniversaryThisYear) {
        years -= 1;
    }
    return Math.max(0, years);
}
function vacationDaysForYears(completedYears) {
    if (completedYears < 1)
        return 0;
    if (completedYears <= 5)
        return 10 + completedYears * 2;
    return 20 + 2 * Math.ceil((completedYears - 5) / 5);
}
function currentAnniversaryStart(hireDate, reference = new Date()) {
    const hire = parseCalendarDate(hireDate);
    const years = completedYearsOfService(hire, reference);
    return new Date(hire.getFullYear() + years, hire.getMonth(), hire.getDate());
}
function buildVacationSummary(hireDate, takenDaysThisPeriod = 0, pendingDaysThisPeriod = 0, carryoverDays = 0, reference = new Date()) {
    const years = completedYearsOfService(hireDate, reference);
    const entitled = vacationDaysForYears(years);
    const carryover = Math.max(0, Number(carryoverDays) || 0);
    const balance = entitled + carryover;
    const available = Math.max(0, balance - takenDaysThisPeriod - pendingDaysThisPeriod);
    return {
        hire_date: hireDate ? toISODate(hireDate) : null,
        years_of_service: years,
        entitled_days: entitled,
        carryover_days: carryover,
        balance_days: balance,
        taken_days: takenDaysThisPeriod,
        pending_days: pendingDaysThisPeriod,
        available_days: available,
        current_period_start: hireDate
            ? toISODate(currentAnniversaryStart(hireDate, reference))
            : null,
    };
}
function buildPayrollSummary(monthlySalary, completedYears) {
    if (monthlySalary == null || Number(monthlySalary) <= 0) {
        return null;
    }
    const monthly = Number(monthlySalary);
    const daily = monthly / 30;
    const vacationDays = vacationDaysForYears(Math.max(1, completedYears));
    const vacationPremiumDays = vacationDays * exports.VACATION_PREMIUM_RATE;
    const integrationFactor = 1 + (exports.MIN_AGUINALDO_DAYS + vacationPremiumDays) / 365;
    return {
        monthly_salary: round2(monthly),
        daily_salary: round2(daily),
        biweekly_salary: round2(monthly / 2),
        weekly_salary: round2((monthly * 12) / 52),
        annual_salary: round2(monthly * 12),
        integration_factor: Number(integrationFactor.toFixed(4)),
        integrated_daily_salary: round2(daily * integrationFactor),
    };
}
function parseCalendarDate(value) {
    if (typeof value === 'string') {
        const [year, month, day] = value.slice(0, 10).split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}
function inclusiveDayCount(start, end) {
    const s = parseCalendarDate(start);
    const e = parseCalendarDate(end);
    const diff = Math.round((e.getTime() - s.getTime()) / MS_PER_DAY);
    return diff + 1;
}
function inclusiveBusinessDayCount(start, end) {
    const s = parseCalendarDate(start);
    const e = parseCalendarDate(end);
    if (e < s)
        return 0;
    let count = 0;
    const cursor = new Date(s);
    while (cursor <= e) {
        const weekday = cursor.getDay();
        if (weekday !== 0 && weekday !== 6) {
            count += 1;
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    return count;
}
function resolveLeaveDays(params) {
    const calendarDays = inclusiveDayCount(params.startDate, params.endDate);
    const countWeekends = params.countWeekends ?? params.type !== 'vacation';
    const computed = countWeekends
        ? calendarDays
        : inclusiveBusinessDayCount(params.startDate, params.endDate);
    if (params.days != null && params.days !== undefined) {
        const days = Number(params.days);
        if (!Number.isFinite(days) || days <= 0) {
            throw new Error('Los días deben ser mayores a 0');
        }
        if (days > calendarDays) {
            throw new Error(`Los días no pueden superar el rango de fechas (${calendarDays})`);
        }
        return {
            days,
            counted_weekends: countWeekends,
            calendar_days: calendarDays,
        };
    }
    return {
        days: computed,
        counted_weekends: countWeekends,
        calendar_days: calendarDays,
    };
}
function round2(value) {
    return Math.round(value * 100) / 100;
}
function toISODate(value) {
    const d = parseCalendarDate(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
//# sourceMappingURL=mexican-labor-law.js.map