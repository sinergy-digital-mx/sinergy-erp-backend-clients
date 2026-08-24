import 'dotenv/config';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { DataSource, QueryRunner } from 'typeorm';

const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';
const EXCEL_FILE = 'RELACION HOA DIVINO (1).xlsx';
const RESULT_FILE = 'RELACION_HOA_DIVINO_RESULTADO.xlsx';
const APPLY = process.argv.includes('--apply');
const MONTHLY_AMOUNT = 50;
const CURRENCY = 'USD';
const AUTO_SCORE = 85;
const AUTO_NAME_SCORE = 70;
const AUTO_GAP = 8;
const REVIEW_SCORE = 60;

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  timezone: 'local',
  dateStrings: true,
});

type ExcelRow = {
  excelNo: string;
  contractDate: string;
  owner: string;
  loteRaw: string;
  mnzRaw: string;
  startRaw: string;
  paidRaw: string;
  lots: string[];
  mnz: string;
  startDate: string | null;
  paidThrough: string | null;
  dateNote: string;
};

type SystemContract = {
  contract_id: string;
  contract_number: string;
  contract_status: string;
  property_id: string;
  code: string;
  block: string;
  lot_number: string;
  property_name: string;
  customer_id: number;
  customer_name: string;
  customer_lastname: string | null;
  additional_name: string | null;
  additional_lastname: string | null;
  systemName: string;
  lotNorm: string;
  blockNorm: string;
};

type HoaPayment = {
  id: string;
  contract_id: string;
  payment_number: string;
  amount: string;
  amount_paid: string;
  amount_pending: string;
  currency: string;
  due_date: string;
  paid_date: string | null;
  status: string;
};

type Candidate = {
  contract: SystemContract;
  nameScore: number;
  lotScore: number;
  mnzScore: number;
  totalScore: number;
  nameDetail: string;
};

type MatchResult = {
  excel: ExcelRow;
  lot: string;
  decision: 'actualizar' | 'revision' | 'sin_match';
  score: number;
  nameScore: number;
  lotScore: number;
  mnzScore: number;
  matchedContract: SystemContract | null;
  matchedName: string;
  secondBest: string;
  reason: string;
  action: string;
};

const STOPWORDS = new Set([
  'de',
  'del',
  'la',
  'las',
  'los',
  'y',
  'e',
  'da',
  'do',
  'van',
  'von',
]);

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeText(value: string | null | undefined): string {
  return stripAccents(String(value || ''))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeName(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function splitPeople(value: string): string[] {
  return String(value || '')
    .split(/\s+y\s+|\s*\/\s*|\s+-\s+|\s+&\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, prevDiag + cost);
      prevDiag = temp;
    }
  }
  return prev[b.length];
}

function tokenSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (!maxLen) return 0;
  const dist = levenshtein(a, b);
  const sim = 1 - dist / maxLen;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) {
    return Math.max(sim, 0.9);
  }
  return sim;
}

function tokensMatch(a: string, b: string): boolean {
  return tokenSimilarity(a, b) >= 0.82;
}

function nameScore(excelName: string, systemName: string): { score: number; detail: string } {
  const excelPeople = splitPeople(excelName).map(tokenizeName).filter((t) => t.length);
  const systemPeople = splitPeople(systemName).map(tokenizeName).filter((t) => t.length);
  const excelAll = tokenizeName(excelName);
  const systemAll = tokenizeName(systemName);

  if (!excelAll.length || !systemAll.length) {
    return { score: 0, detail: 'sin tokens' };
  }

  const coverage = (source: string[], target: string[]): number => {
    if (!source.length) return 0;
    let matched = 0;
    const used = new Set<number>();
    for (const token of source) {
      let best = 0;
      let bestIdx = -1;
      for (let i = 0; i < target.length; i++) {
        if (used.has(i)) continue;
        const sim = tokenSimilarity(token, target[i]);
        if (sim > best) {
          best = sim;
          bestIdx = i;
        }
      }
      if (best >= 0.82 && bestIdx >= 0) {
        matched += best;
        used.add(bestIdx);
      }
    }
    return matched / source.length;
  };

  const excelToSystem = coverage(excelAll, systemAll);
  const systemToExcel = coverage(systemAll, excelAll);
  const tokenScore = Math.round(((excelToSystem + systemToExcel) / 2) * 100);

  let personBest = 0;
  let firstNameHits = 0;
  let surnameHits = 0;
  for (const excelPerson of excelPeople.length ? excelPeople : [excelAll]) {
    for (const systemPerson of systemPeople.length ? systemPeople : [systemAll]) {
      const excelFirst = excelPerson[0];
      const systemFirst = systemPerson[0];
      const excelSurnames = excelPerson.slice(1);
      const systemSurnames = systemPerson.slice(1);
      const first = excelFirst && systemFirst ? tokenSimilarity(excelFirst, systemFirst) : 0;
      const surnameCov =
        excelSurnames.length && systemSurnames.length
          ? coverage(excelSurnames, systemSurnames)
          : excelSurnames.length || systemSurnames.length
            ? 0.35
            : first >= 0.9
              ? 0.7
              : 0;
      const person = Math.round((first * 0.45 + surnameCov * 0.55) * 100);
      if (person > personBest) {
        personBest = person;
        firstNameHits = first;
        surnameHits = surnameCov;
      }
    }
  }

  // Nombres cortos tipo "Alma y Enrique": si todos los tokens del Excel están en sistema, subir.
  const allExcelInSystem = excelAll.every((token) =>
    systemAll.some((sys) => tokensMatch(token, sys)),
  );
  const allSystemInExcel = systemAll.every((token) =>
    excelAll.some((ex) => tokensMatch(token, ex)),
  );

  let score = Math.max(tokenScore, personBest);
  if (allExcelInSystem && allSystemInExcel) score = Math.max(score, 98);
  else if (allExcelInSystem) score = Math.max(score, 90);
  if (firstNameHits < 0.82 && surnameHits >= 0.8 && excelAll.length > 1) {
    score = Math.min(score, 62);
  }

  return {
    score,
    detail: `tokens=${tokenScore} persona=${personBest} first=${Math.round(firstNameHits * 100)} apell=${Math.round(surnameHits * 100)}`,
  };
}

function normalizeLot(value: string | null | undefined): string {
  const raw = String(value || '')
    .toUpperCase()
    .replace(/LOTE/g, '')
    .trim();
  const numeric = raw.replace(/^0+/, '').replace(/[^0-9].*$/, '');
  return numeric || raw.replace(/[^0-9A-Z]/g, '');
}

function parseLots(loteRaw: string): string[] {
  const cleaned = String(loteRaw || '').trim();
  if (!cleaned) return [];
  return cleaned
    .split(/\s*y\s*|\s*,\s*|\s*\/\s*/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(normalizeLot)
    .filter(Boolean);
}

function parseFlexibleDate(value: unknown): { iso: string | null; note: string } {
  if (value === null || value === undefined || value === '') {
    return { iso: null, note: 'vacio' };
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const utcDays = Math.floor(value - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    const iso = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
    return { iso, note: 'serial' };
  }

  const raw = String(value).trim();
  const lower = raw.toLowerCase();
  if (!raw || lower === 'pendiente') {
    return { iso: null, note: lower === 'pendiente' ? 'pendiente' : 'vacio' };
  }

  const monthMap: Record<string, number> = {
    jan: 1,
    ene: 1,
    enero: 1,
    feb: 2,
    febrero: 2,
    mar: 3,
    marzo: 3,
    apr: 4,
    abr: 4,
    abril: 4,
    may: 5,
    mayo: 5,
    jun: 6,
    junio: 6,
    jul: 7,
    julio: 7,
    aug: 8,
    ago: 8,
    agosto: 8,
    sep: 9,
    sept: 9,
    septiembre: 9,
    oct: 10,
    octubre: 10,
    nov: 11,
    noviembre: 11,
    dec: 12,
    dic: 12,
    diciembre: 12,
  };

  const monthName = raw.match(/^([A-Za-z]+)\s*-?\s*(\d{2,4})$/);
  if (monthName) {
    const month = monthMap[monthName[1].toLowerCase()];
    if (month) {
      let year = Number(monthName[2]);
      if (year < 100) year += 2000;
      return {
        iso: `${year}-${String(month).padStart(2, '0')}-01`,
        note: 'mes-anio',
      };
    }
  }

  const mdY = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (mdY) {
    const month = Number(mdY[1]);
    const day = Number(mdY[2]);
    let year = Number(mdY[3]);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12) {
      return {
        iso: `${year}-${String(month).padStart(2, '0')}-01`,
        note: 'm/d/y',
      };
    }
  }

  return { iso: null, note: `no_parse:${raw}` };
}

function monthKey(dateStr: string): string {
  return String(dateStr).slice(0, 7);
}

function listMonths(startIso: string, endIso: string): string[] {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return [];
  }
  const months: string[] = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    months.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`,
    );
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return months;
}

function dueDateForMonth(monthKeyValue: string, day: number): string {
  const [year, month] = monthKeyValue.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

function systemFullName(row: SystemContract): string {
  return [
    row.customer_name,
    row.customer_lastname,
    row.additional_name,
    row.additional_lastname,
  ]
    .filter(Boolean)
    .join(' ');
}

function scoreCandidate(excel: ExcelRow, lot: string, contract: SystemContract): Candidate {
  const named = nameScore(excel.owner, contract.systemName);
  const lotScore = lot && contract.lotNorm && lot === contract.lotNorm ? 100 : 0;
  const mnzScore = excel.mnz && contract.blockNorm && excel.mnz === contract.blockNorm ? 100 : 0;
  const totalScore = Math.round(named.score * 0.6 + lotScore * 0.25 + mnzScore * 0.15);
  return {
    contract,
    nameScore: named.score,
    lotScore,
    mnzScore,
    totalScore,
    nameDetail: named.detail,
  };
}

function readExcel(): ExcelRow[] {
  const workbook = XLSX.readFile(path.join(process.cwd(), EXCEL_FILE));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: false,
  }) as any[][];

  const result: ExcelRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || (!row[0] && !row[2])) continue;
    const owner = String(row[2] || '').trim();
    if (!owner) continue;
    if (/^propietario/i.test(owner) || String(row[0]).trim().toLowerCase() === 'no.') continue;
    const start = parseFlexibleDate(row[5]);
    const paid = parseFlexibleDate(row[6]);
    const loteRaw = String(row[3] ?? '').trim();
    const mnzRaw = String(row[4] ?? '').trim();
    result.push({
      excelNo: String(row[0] ?? i),
      contractDate: String(row[1] ?? ''),
      owner,
      loteRaw,
      mnzRaw,
      startRaw: String(row[5] ?? ''),
      paidRaw: String(row[6] ?? ''),
      lots: parseLots(loteRaw),
      mnz: normalizeLot(mnzRaw),
      startDate: start.iso,
      paidThrough: paid.iso,
      dateNote: `inicio=${start.note};pagada=${paid.note}`,
    });
  }
  return result;
}

function decideMatch(excel: ExcelRow, lot: string, ranked: Candidate[]): MatchResult {
  const best = ranked[0];
  const second = ranked[1];
  const gap = best && second ? best.totalScore - second.totalScore : 100;
  const secondLabel = second
    ? `${second.contract.code} ${second.contract.systemName} (${second.totalScore}%)`
    : '';

  if (!best || best.totalScore < REVIEW_SCORE) {
    return {
      excel,
      lot,
      decision: 'sin_match',
      score: best?.totalScore ?? 0,
      nameScore: best?.nameScore ?? 0,
      lotScore: best?.lotScore ?? 0,
      mnzScore: best?.mnzScore ?? 0,
      matchedContract: best?.contract ?? null,
      matchedName: best ? `${best.contract.code} ${best.contract.systemName}` : '',
      secondBest: secondLabel,
      reason: best
        ? `score ${best.totalScore}% bajo umbral`
        : 'sin candidatos',
      action: 'no actualizar',
    };
  }

  const uniqueEnough = gap >= AUTO_GAP || !second;
  const exactLotAndBlock = best.lotScore === 100 && best.mnzScore === 100;
  const good =
    uniqueEnough &&
    best.nameScore >= AUTO_NAME_SCORE &&
    (best.totalScore >= AUTO_SCORE ||
      (exactLotAndBlock && best.nameScore >= AUTO_NAME_SCORE));

  if (good) {
    return {
      excel,
      lot,
      decision: 'actualizar',
      score: best.totalScore,
      nameScore: best.nameScore,
      lotScore: best.lotScore,
      mnzScore: best.mnzScore,
      matchedContract: best.contract,
      matchedName: `${best.contract.code} ${best.contract.systemName}`,
      secondBest: secondLabel,
      reason: `${best.nameDetail}; gap=${gap}`,
      action: '',
    };
  }

  return {
    excel,
    lot,
    decision: 'revision',
    score: best.totalScore,
    nameScore: best.nameScore,
    lotScore: best.lotScore,
    mnzScore: best.mnzScore,
    matchedContract: best.contract,
    matchedName: `${best.contract.code} ${best.contract.systemName}`,
    secondBest: secondLabel,
    reason: !uniqueEnough
      ? `empate/ambiguo gap=${gap}`
      : best.nameScore < AUTO_NAME_SCORE
        ? `nombre ${best.nameScore}% insuficiente`
        : `score ${best.totalScore}% para revision`,
    action: 'no actualizar, revision manual',
  };
}

function writeResultWorkbook(
  results: MatchResult[],
  applyLog: string[][],
  unmatchedSystem: SystemContract[],
): void {
  const wb = XLSX.utils.book_new();

  const allRows = results.map((r) => ({
    No: r.excel.excelNo,
    Propietario_Excel: r.excel.owner,
    Lote_Excel: r.excel.loteRaw,
    Mnz_Excel: r.excel.mnzRaw,
    Lote_Evaluado: r.lot,
    FECHA_INICIO: r.excel.startRaw,
    FECHA_PAGADA: r.excel.paidRaw,
    Inicio_ISO: r.excel.startDate || '',
    Pagada_ISO: r.excel.paidThrough || '',
    Decision: r.decision,
    Score_Total: r.score,
    Score_Nombre: r.nameScore,
    Score_Lote: r.lotScore,
    Score_Mnz: r.mnzScore,
    Contrato: r.matchedContract?.contract_number || '',
    Codigo_Lote: r.matchedContract?.code || '',
    Nombre_Sistema: r.matchedContract?.systemName || '',
    Segundo_Mejor: r.secondBest,
    Motivo: r.reason,
    Accion: r.action,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allRows), 'Resultado');

  const unmatched = results
    .filter((r) => r.decision !== 'actualizar')
    .map((r) => ({
      No: r.excel.excelNo,
      Propietario_Excel: r.excel.owner,
      Lote_Excel: r.excel.loteRaw,
      Mnz_Excel: r.excel.mnzRaw,
      FECHA_INICIO: r.excel.startRaw,
      FECHA_PAGADA: r.excel.paidRaw,
      Decision: r.decision,
      Score_Total: r.score,
      Score_Nombre: r.nameScore,
      Mejor_Candidato: r.matchedName,
      Segundo_Mejor: r.secondBest,
      Motivo: r.reason,
    }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(unmatched), 'Sin_match_o_revision');

  const updated = results
    .filter((r) => r.decision === 'actualizar')
    .map((r) => ({
      No: r.excel.excelNo,
      Propietario_Excel: r.excel.owner,
      Lote_Excel: r.excel.loteRaw,
      Mnz_Excel: r.excel.mnzRaw,
      Contrato: r.matchedContract?.contract_number,
      Codigo_Lote: r.matchedContract?.code,
      Nombre_Sistema: r.matchedContract?.systemName,
      Score: r.score,
      Inicio: r.excel.startDate || '',
      Pagada: r.excel.paidThrough || '',
      Accion: r.action,
    }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(updated), 'Actualizados');

  if (applyLog.length) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([['Contrato', 'Codigo', 'Accion', 'Detalle'], ...applyLog]),
      'Cambios_DB',
    );
  }

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      unmatchedSystem.map((c) => ({
        Contrato: c.contract_number,
        Codigo_Lote: c.code,
        Manzana: c.block,
        Lote: c.lot_number,
        Nombre_Sistema: c.systemName,
        Status: c.contract_status,
        Motivo: 'En sistema, no aparece en el Excel',
      })),
    ),
    'En_sistema_sin_excel',
  );

  XLSX.writeFile(wb, path.join(process.cwd(), RESULT_FILE));
}

async function syncHoaForContract(
  ds: QueryRunner,
  match: MatchResult,
  paymentsByContract: Map<string, HoaPayment[]>,
): Promise<string> {
  const contract = match.matchedContract;
  if (!contract) return 'sin contrato';

  const payments = [...(paymentsByContract.get(contract.contract_id) || [])].sort(
    (a, b) => String(a.due_date).localeCompare(String(b.due_date)),
  );
  const active = payments.filter((p) => p.status !== 'cancelado');
  const paymentDay =
    active.length > 0
      ? Number(String(active[0].due_date).slice(8, 10)) || 5
      : 5;

  let convertedMxn = 0;
  for (const payment of payments) {
    const isMxn = String(payment.currency || '').toUpperCase() === 'MXN';
    const amount = Number(payment.amount) || 0;
    const needsCurrency = isMxn || String(payment.currency || '').toUpperCase() !== CURRENCY;
    const needsAmount = amount !== MONTHLY_AMOUNT;
    if (!needsCurrency && !needsAmount) continue;

    const status = payment.status;
    let amountPaid = Number(payment.amount_paid) || 0;
    let amountPending = Number(payment.amount_pending) || 0;
    if (status === 'pagado') {
      amountPaid = MONTHLY_AMOUNT;
      amountPending = 0;
    } else if (status === 'pendiente') {
      amountPaid = 0;
      amountPending = MONTHLY_AMOUNT;
    } else if (status === 'parcial') {
      amountPending = Math.max(0, MONTHLY_AMOUNT - amountPaid);
    } else {
      amountPending = MONTHLY_AMOUNT;
    }

    await ds.query(
      `UPDATE contract_hoa_payments
       SET amount = ?, amount_paid = ?, amount_pending = ?, currency = ?, updated_at = NOW()
       WHERE id = ? AND tenant_id = ?`,
      [MONTHLY_AMOUNT, amountPaid, amountPending, CURRENCY, payment.id, TENANT_ID],
    );
    if (isMxn) convertedMxn += 1;
  }

  const start = match.excel.startDate || match.excel.paidThrough;
  const paidThrough = match.excel.paidThrough || match.excel.startDate;
  const actions: string[] = [];
  if (convertedMxn) actions.push(`MXN->USD ${convertedMxn}`);

  if (!start || !paidThrough) {
    if (!payments.length) {
      actions.push('sin fechas y sin HOA, no se genero');
      return actions.join('; ') || 'sin cambios de fechas';
    }
    actions.push('solo moneda/monto, fechas pendiente/vacias');
    return actions.join('; ');
  }

  const targetMonths = listMonths(start, paidThrough);
  if (!targetMonths.length) {
    actions.push('rango de fechas invalido');
    return actions.join('; ');
  }

  const byMonth = new Map<string, HoaPayment>();
  for (const payment of active) {
    const key = monthKey(String(payment.due_date));
    if (!byMonth.has(key)) byMonth.set(key, payment);
  }

  let created = 0;
  let markedPaid = 0;
  let nextNumber =
    payments.reduce((max, p) => Math.max(max, Number(p.payment_number) || 0), 0) + 1;

  for (const month of targetMonths) {
    const existing = byMonth.get(month);
    if (!existing) {
      await ds.query(
        `INSERT INTO contract_hoa_payments
          (id, tenant_id, contract_id, payment_number, amount, amount_paid, amount_pending,
           currency, due_date, paid_date, first_partial_payment_date, payment_method, status,
           is_overdue, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'pagado', 0, ?, NOW(), NOW())`,
        [
          randomUUID(),
          TENANT_ID,
          contract.contract_id,
          String(nextNumber++),
          MONTHLY_AMOUNT,
          MONTHLY_AMOUNT,
          0,
          CURRENCY,
          dueDateForMonth(month, paymentDay),
          dueDateForMonth(month, paymentDay),
          `Importado relacion HOA Divino ${match.excel.startRaw} - ${match.excel.paidRaw}`,
        ],
      );
      created += 1;
      continue;
    }

    if (existing.status !== 'pagado' && existing.status !== 'cancelado') {
      await ds.query(
        `UPDATE contract_hoa_payments
         SET amount = ?, amount_paid = ?, amount_pending = ?, currency = ?,
             status = 'pagado', paid_date = COALESCE(paid_date, due_date),
             is_overdue = 0, updated_at = NOW()
         WHERE id = ? AND tenant_id = ?`,
        [MONTHLY_AMOUNT, MONTHLY_AMOUNT, 0, CURRENCY, existing.id, TENANT_ID],
      );
      markedPaid += 1;
    }
  }

  if (created) actions.push(`creados ${created} meses pagados`);
  if (markedPaid) actions.push(`marcados pagados ${markedPaid}`);
  actions.push(`rango ${start} a ${paidThrough} (${targetMonths.length} meses)`);
  return actions.join('; ');
}

async function main() {
  const excelRows = readExcel();
  await AppDataSource.initialize();

  const contractsRaw = await AppDataSource.query(
    `
    SELECT
      c.id AS contract_id,
      c.contract_number,
      c.status AS contract_status,
      p.id AS property_id,
      p.code,
      p.block,
      p.lot_number,
      p.name AS property_name,
      cu.id AS customer_id,
      cu.name AS customer_name,
      cu.lastname AS customer_lastname,
      cu.additional_name,
      cu.additional_lastname
    FROM contracts c
    INNER JOIN properties p ON p.id = c.property_id
    INNER JOIN customers cu ON cu.id = c.customer_id
    WHERE c.tenant_id = ?
      AND c.status IN ('activo', 'completado')
    `,
    [TENANT_ID],
  );

  const contracts: SystemContract[] = contractsRaw.map((row: any) => ({
    ...row,
    systemName: systemFullName(row),
    lotNorm: normalizeLot(row.lot_number),
    blockNorm: normalizeLot(row.block),
  }));

  const hoaRaw: HoaPayment[] = await AppDataSource.query(
    `
    SELECT id, contract_id, payment_number, amount, amount_paid, amount_pending,
           currency, due_date, paid_date, status
    FROM contract_hoa_payments
    WHERE tenant_id = ?
    `,
    [TENANT_ID],
  );
  const paymentsByContract = new Map<string, HoaPayment[]>();
  for (const payment of hoaRaw) {
    const list = paymentsByContract.get(payment.contract_id) || [];
    list.push(payment);
    paymentsByContract.set(payment.contract_id, list);
  }

  const results: MatchResult[] = [];
  for (const excel of excelRows) {
    const lots = excel.lots.length ? excel.lots : [''];
    for (const lot of lots) {
      const ranked = contracts
        .map((contract) => scoreCandidate(excel, lot, contract))
        .sort((a, b) => b.totalScore - a.totalScore || b.nameScore - a.nameScore);
      results.push(decideMatch(excel, lot, ranked));
    }
  }

  const usedContracts = new Set<string>();
  for (const result of results) {
    if (result.decision !== 'actualizar' || !result.matchedContract) continue;
    const id = result.matchedContract.contract_id;
    if (usedContracts.has(id)) {
      result.decision = 'revision';
      result.reason = `contrato ${result.matchedContract.contract_number} ya asignado a otro renglón`;
      result.action = 'no actualizar, duplicado';
      continue;
    }
    usedContracts.add(id);
  }

  const applyLog: string[][] = [];
  if (APPLY) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const result of results) {
        if (result.decision !== 'actualizar' || !result.matchedContract) continue;
        const action = await syncHoaForContract(queryRunner, result, paymentsByContract);
        result.action = action;
        applyLog.push([
          result.matchedContract.contract_number,
          result.matchedContract.code,
          action,
          `${result.excel.owner} | lote ${result.lot} mnz ${result.excel.mnz} | score ${result.score}%`,
        ]);
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } else {
    for (const result of results) {
      if (result.decision !== 'actualizar' || !result.matchedContract) continue;
      const payments = paymentsByContract.get(result.matchedContract.contract_id) || [];
      const mxn = payments.filter((p) => String(p.currency).toUpperCase() === 'MXN').length;
      const start = result.excel.startDate || result.excel.paidThrough;
      const end = result.excel.paidThrough || result.excel.startDate;
      const months = start && end ? listMonths(start, end).length : 0;
      result.action = [
        mxn ? `convertiria ${mxn} MXN->USD` : 'ya USD/sin HOA',
        months ? `rango ${start} a ${end} (${months} meses pagados)` : 'sin fechas',
        payments.length ? `${payments.length} pagos actuales` : 'sin pagos HOA, se generarian',
      ].join('; ');
    }
  }

  const matchedIds = new Set(
    results
      .filter((r) => r.matchedContract && r.decision !== 'sin_match')
      .map((r) => r.matchedContract!.contract_id),
  );
  const unmatchedSystem = contracts.filter((c) => !matchedIds.has(c.contract_id));
  writeResultWorkbook(results, applyLog, unmatchedSystem);

  const updated = results.filter((r) => r.decision === 'actualizar');
  const review = results.filter((r) => r.decision === 'revision');
  const unmatched = results.filter((r) => r.decision === 'sin_match');

  console.log(`Modo: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Excel filas: ${excelRows.length} | evaluaciones lote: ${results.length}`);
  console.log(`Contratos sistema: ${contracts.length} | HOA existentes: ${hoaRaw.length}`);
  console.log(`Actualizar: ${updated.length} | Revision: ${review.length} | Sin match: ${unmatched.length}`);
  console.log(`Archivo: ${RESULT_FILE}`);
  console.log('\n=== ACTUALIZAR ===');
  for (const row of updated) {
    console.log(
      `#${row.excel.excelNo} ${row.excel.owner} | lote ${row.lot} mnz ${row.excel.mnz} -> ${row.matchedContract?.code} ${row.matchedContract?.systemName} | ${row.score}% | ${row.action}`,
    );
  }
  console.log('\n=== REVISION ===');
  for (const row of review) {
    console.log(
      `#${row.excel.excelNo} ${row.excel.owner} | lote ${row.lot} mnz ${row.excel.mnz} -> ${row.matchedName} | ${row.score}% | ${row.reason} | 2do: ${row.secondBest}`,
    );
  }
  console.log('\n=== SIN MATCH ===');
  for (const row of unmatched) {
    console.log(
      `#${row.excel.excelNo} ${row.excel.owner} | lote ${row.lot} mnz ${row.excel.mnz} | ${row.score}% | ${row.matchedName || 'n/a'} | ${row.reason}`,
    );
  }

  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
