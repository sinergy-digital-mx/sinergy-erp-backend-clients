export declare const SYSTEM_VERSION_RELEASES: Array<{
    releaseKey: string;
    version: string;
    buildId: string | null;
    channel: 'frontend' | 'backend' | 'full';
    title: string;
    changes: Array<{
        scope: 'frontend' | 'backend';
        message: string;
    }>;
    releasedAt: string;
}>;
