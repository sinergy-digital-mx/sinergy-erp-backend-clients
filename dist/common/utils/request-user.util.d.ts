type RequestUserLike = {
    sub?: unknown;
    id?: unknown;
    user_id?: unknown;
    hasAdminRole?: unknown;
    roles?: unknown;
};
export declare function resolveRequestUserId(user: RequestUserLike | null | undefined): string;
export declare function resolveHasAdminRole(user: RequestUserLike | null | undefined): boolean;
export {};
