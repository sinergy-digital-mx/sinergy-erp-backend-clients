"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPropertyImportJob = createPropertyImportJob;
exports.getPropertyImportJob = getPropertyImportJob;
exports.updatePropertyImportJob = updatePropertyImportJob;
const jobs = new Map();
const JOB_TTL_MS = 2 * 60 * 60 * 1000;
function touch(job) {
    job.updated_at = new Date().toISOString();
    job.percent =
        job.total > 0
            ? Math.min(100, Math.round((job.processed / job.total) * 100))
            : job.status === 'completed'
                ? 100
                : 0;
}
function createPropertyImportJob(input) {
    purgeExpiredJobs();
    const now = new Date().toISOString();
    const job = {
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
function getPropertyImportJob(jobId, organizationId) {
    const job = jobs.get(jobId);
    if (!job || job.organization_id !== organizationId) {
        return null;
    }
    return job;
}
function updatePropertyImportJob(jobId, patch) {
    const job = jobs.get(jobId);
    if (!job)
        return;
    Object.assign(job, patch);
    touch(job);
}
function purgeExpiredJobs() {
    const cutoff = Date.now() - JOB_TTL_MS;
    for (const [id, job] of jobs) {
        if (new Date(job.updated_at).getTime() < cutoff) {
            jobs.delete(id);
        }
    }
}
//# sourceMappingURL=property-import-job.store.js.map