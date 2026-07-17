/**
 * Utilidades de cálculo según la Ley Federal del Trabajo (México).
 *
 * - Vacaciones: art. 76 reformado (reforma "Vacaciones Dignas", vigente desde
 *   el 1 de enero de 2023).
 * - Nómina: derivados del sueldo mensual (diario, quincenal, semanal, anual) y
 *   Salario Diario Integrado (SDI) con factor de integración.
 */

// Días de aguinaldo mínimos por ley (art. 87 LFT).
export const MIN_AGUINALDO_DAYS = 15;

// Prima vacacional mínima (art. 80 LFT): 25% sobre los días de vacaciones.
export const VACATION_PREMIUM_RATE = 0.25;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Devuelve los años completos de antigüedad entre la fecha de ingreso y una
 * fecha de referencia (por defecto hoy).
 */
export function completedYearsOfService(
  hireDate: Date | string | null | undefined,
  reference: Date = new Date(),
): number {
  if (!hireDate) return 0;
  const hire = typeof hireDate === 'string' ? new Date(hireDate) : hireDate;
  if (isNaN(hire.getTime())) return 0;

  let years = reference.getFullYear() - hire.getFullYear();
  const anniversaryThisYear = new Date(
    reference.getFullYear(),
    hire.getMonth(),
    hire.getDate(),
  );
  if (reference < anniversaryThisYear) {
    years -= 1;
  }
  return Math.max(0, years);
}

/**
 * Días de vacaciones que corresponden por ley según los años cumplidos de
 * antigüedad (tabla art. 76 LFT, reforma 2023).
 *
 * - 1 año: 12 días; +2 por año hasta el 5º (20 días).
 * - A partir del 6º año: +2 días por cada 5 años de servicio.
 */
export function vacationDaysForYears(completedYears: number): number {
  if (completedYears < 1) return 0;
  if (completedYears <= 5) return 10 + completedYears * 2;
  return 20 + 2 * Math.ceil((completedYears - 5) / 5);
}

/**
 * Fecha del último aniversario laboral cumplido (inicio del periodo vacacional
 * vigente). Si aún no cumple el primer año, regresa la fecha de ingreso.
 */
export function currentAnniversaryStart(
  hireDate: Date | string,
  reference: Date = new Date(),
): Date {
  const hire = typeof hireDate === 'string' ? new Date(hireDate) : hireDate;
  const years = completedYearsOfService(hire, reference);
  return new Date(hire.getFullYear() + years, hire.getMonth(), hire.getDate());
}

export interface VacationSummary {
  hire_date: string | null;
  years_of_service: number;
  entitled_days: number; // días que corresponden en el periodo vigente
  taken_days: number; // días de vacaciones aprobados en el periodo vigente
  pending_days: number; // días de vacaciones en solicitudes pendientes
  available_days: number; // disponibles = corresponden - tomados - pendientes
  current_period_start: string | null;
}

/**
 * Calcula el resumen de vacaciones del empleado para el periodo (año laboral)
 * vigente.
 *
 * @param takenDaysThisPeriod  Días de vacaciones ya aprobados dentro del periodo vigente.
 * @param pendingDaysThisPeriod Días de vacaciones en solicitudes pendientes del periodo vigente.
 */
export function buildVacationSummary(
  hireDate: Date | string | null | undefined,
  takenDaysThisPeriod = 0,
  pendingDaysThisPeriod = 0,
  reference: Date = new Date(),
): VacationSummary {
  const years = completedYearsOfService(hireDate, reference);
  const entitled = vacationDaysForYears(years);
  const available = Math.max(
    0,
    entitled - takenDaysThisPeriod - pendingDaysThisPeriod,
  );

  return {
    hire_date: hireDate ? toISODate(hireDate) : null,
    years_of_service: years,
    entitled_days: entitled,
    taken_days: takenDaysThisPeriod,
    pending_days: pendingDaysThisPeriod,
    available_days: available,
    current_period_start: hireDate
      ? toISODate(currentAnniversaryStart(hireDate, reference))
      : null,
  };
}

export interface PayrollSummary {
  monthly_salary: number;
  daily_salary: number; // sueldo diario = mensual / 30
  biweekly_salary: number; // quincenal = mensual / 2
  weekly_salary: number;
  annual_salary: number;
  integration_factor: number; // factor de integración SDI
  integrated_daily_salary: number; // SDI = diario * factor
}

/**
 * Calcula los montos derivados del sueldo mensual. El Salario Diario Integrado
 * (SDI) usa el factor de integración = 1 + (aguinaldo + primaVacacional)/365,
 * donde primaVacacional = díasVacaciones * 25%.
 */
export function buildPayrollSummary(
  monthlySalary: number | null | undefined,
  completedYears: number,
): PayrollSummary | null {
  if (monthlySalary == null || Number(monthlySalary) <= 0) {
    return null;
  }

  const monthly = Number(monthlySalary);
  const daily = monthly / 30;
  const vacationDays = vacationDaysForYears(Math.max(1, completedYears));
  const vacationPremiumDays = vacationDays * VACATION_PREMIUM_RATE;
  const integrationFactor =
    1 + (MIN_AGUINALDO_DAYS + vacationPremiumDays) / 365;

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

/**
 * Cuenta los días naturales entre dos fechas inclusivas (start y end).
 */
export function inclusiveDayCount(
  start: Date | string,
  end: Date | string,
): number {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  const diff = Math.round((e.getTime() - s.getTime()) / MS_PER_DAY);
  return diff + 1;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function toISODate(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}
