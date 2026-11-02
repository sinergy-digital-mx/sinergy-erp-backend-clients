export interface JwtPermissionUser {
    permissions?: unknown;
    hasAdminRole?: boolean;
}
export declare function userHasJwtPermission(user: JwtPermissionUser | null | undefined, entity: string, action: string): boolean;
