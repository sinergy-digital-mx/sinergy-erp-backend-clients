export declare const USER_STATUS_CODE: {
    readonly ACTIVE: "active";
    readonly INACTIVE: "inactive";
    readonly DELETED: "deleted";
};
export type UserStatusCode = (typeof USER_STATUS_CODE)[keyof typeof USER_STATUS_CODE];
export declare function normalizeUserStatusCode(code?: string | null): string;
export declare function isActiveUserStatus(code?: string | null): boolean;
