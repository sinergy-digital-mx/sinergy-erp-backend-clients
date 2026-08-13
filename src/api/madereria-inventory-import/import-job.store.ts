export type ImportJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export type ImportInventoryJobResult = {
  warehouse_id: string;
  warehouse_name: string;
  file_rows: number;
  products_created: Array<{ sku: string; name: string; row_number: number }>;
  prices_created: number;
  costs_created: number;
  costs_updated: number;
  batches_created: number;
  skipped: Array<{ sku: string; row_number: number; reason: string }>;
  errors: Array<{ sku: string; row_number: number; message: string }>;
};

export type ImportInventoryJob = {
  id: string;
  organization_id: string;
  user_id: string;
  status: ImportJobStatus;
  total: number;
  processed: number;
  current_sku: string | null;
  message: string;
  percent: number;
  result: ImportInventoryJobResult | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

/** Jobs en memoria (proceso actual). Suficiente para un solo nodo. */
const jobs = new Map<string, ImportInventoryJob>();

const JOB_TTL_MS = 2 * 60 * 60 * 1000; // 2 h

function touch(job: ImportInventoryJob): void {
  job.updated_at = new Date().toISOString();
  job.percent =
    job.total > 0
      ? Math.min(100, Math.round((job.processed / job.total) * 100))
      : job.status === 'completed'
        ? 100
        : 0;
}

export function createImportJob(input: {
  id: string;
  organizationId: string;
  userId: string;
  total: number;
}): ImportInventoryJob {
  purgeExpiredJobs();
  const now = new Date().toISOString();
  const job: ImportInventoryJob = {
    id: input.id,
    organization_id: input.organizationId,
    user_id: input.userId,
    status: 'queued',
    total: input.total,
    processed: 0,
    current_sku: null,
    message: 'En cola…',
    percent: 0,
    result: null,
    error: null,
    created_at: now,
    updated_at: now,
  };
  jobs.set(job.id, job);
  return job;
}

export function getImportJob(
  jobId: string,
  organizationId: string,
): ImportInventoryJob | null {
  const job = jobs.get(jobId);
  if (!job) return null;
  if (job.organization_id !== organizationId) return null;
  return job;
}

export function updateImportJob(
  jobId: string,
  patch: Partial<
    Pick<
      ImportInventoryJob,
      | 'status'
      | 'processed'
      | 'current_sku'
      | 'message'
      | 'result'
      | 'error'
      | 'total'
    >
  >,
): void {
  const job = jobs.get(jobId);
  if (!job) return;
  Object.assign(job, patch);
  touch(job);
}

function purgeExpiredJobs(): void {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of jobs) {
    if (new Date(job.updated_at).getTime() < cutoff) {
      jobs.delete(id);
    }
  }
}
