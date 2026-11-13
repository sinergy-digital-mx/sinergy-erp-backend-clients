export type PropertyImportJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export type PropertyImportSkippedRow = {
  row: number;
  message: string;
  code?: string;
};

export type PropertyImportJobResult = {
  created: number;
  skipped: PropertyImportSkippedRow[];
};

export type PropertyImportJob = {
  id: string;
  organization_id: string;
  status: PropertyImportJobStatus;
  total: number;
  processed: number;
  percent: number;
  current_code: string | null;
  message: string;
  result: PropertyImportJobResult | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

const jobs = new Map<string, PropertyImportJob>();
const JOB_TTL_MS = 2 * 60 * 60 * 1000;

function touch(job: PropertyImportJob): void {
  job.updated_at = new Date().toISOString();
  job.percent =
    job.total > 0
      ? Math.min(100, Math.round((job.processed / job.total) * 100))
      : job.status === 'completed'
        ? 100
        : 0;
}

export function createPropertyImportJob(input: {
  id: string;
  organizationId: string;
  total: number;
}): PropertyImportJob {
  purgeExpiredJobs();
  const now = new Date().toISOString();
  const job: PropertyImportJob = {
    id: input.id,
    organization_id: input.organizationId,
    status: 'queued',
    total: input.total,
    processed: 0,
    percent: 0,
    current_code: null,
    message: 'En cola…',
    result: null,
    error: null,
    created_at: now,
    updated_at: now,
  };
  jobs.set(job.id, job);
  return job;
}

export function getPropertyImportJob(
  jobId: string,
  organizationId: string,
): PropertyImportJob | null {
  const job = jobs.get(jobId);
  if (!job || job.organization_id !== organizationId) {
    return null;
  }
  return job;
}

export function updatePropertyImportJob(
  jobId: string,
  patch: Partial<
    Pick<
      PropertyImportJob,
      | 'status'
      | 'processed'
      | 'total'
      | 'current_code'
      | 'message'
      | 'result'
      | 'error'
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
