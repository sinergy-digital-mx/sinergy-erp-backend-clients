export type ReleaseScope = 'frontend' | 'backend';
export type ReleaseChannel = 'frontend' | 'backend' | 'full';
export interface ReleaseChange {
    scope: ReleaseScope;
    message: string;
    module?: string;
    moduleLabel?: string;
}
export interface ReleasePayload {
    releaseKey: string;
    version: string;
    buildId: string | null;
    channel: ReleaseChannel;
    title: string;
    changes: ReleaseChange[];
    releasedAt: string;
}
export declare const FALLBACK_RELEASE_MESSAGE = "Actualizaci\u00F3n de la plataforma.";
export declare function selectReleaseSubjects(subjects: string[], limit?: number): string[];
export declare function shouldIgnoreReleasePath(filePath: string): boolean;
export declare function summarizeChangedPaths(filePaths: string[], limit?: number): string[];
export declare function changesFromSubjects(subjects: string[], scope: ReleaseScope, limit?: number): ReleaseChange[];
export declare const RELEASE_MODULES: Record<string, {
    label: string;
    codes: string[];
}>;
export declare function normalizeModuleCode(value: unknown): string | null;
export declare function moduleLabel(moduleCode: string | null | undefined): string | null;
export declare function moduleIsVisible(moduleCode: string, enabled: Set<string>): boolean;
export declare function presentReleaseChange(change: ReleaseChange): {
    scope: ReleaseScope;
    message: string;
    module: string | null;
    module_label: string | null;
};
export declare function filterChangesForModules(changes: ReleaseChange[], enabledModuleCodes: Iterable<string>): ReleaseChange[];
export declare function sanitizeReleaseChanges(changes: unknown, limit?: number): ReleaseChange[];
export declare function mergeReleaseChanges(groups: ReleaseChange[][]): ReleaseChange[];
export declare function toSqlDateTime(value?: string | null): string;
export declare function buildReleasePayload(input: {
    version: string;
    buildId?: string | null;
    channel: ReleaseChannel;
    changes: ReleaseChange[];
    releasedAt?: string;
}): ReleasePayload;
