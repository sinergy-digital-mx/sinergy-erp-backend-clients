import { Strategy } from 'passport-jwt';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly logger;
    constructor();
    validate(payload: any): Promise<{
        id: any;
        user_id: any;
        tenantId: any;
        tenant_id: any;
        email: any;
        status: any;
        roles: any;
        permissions: any;
        permissions_version: any;
        hasAdminRole: any;
        permissionCount: any;
    }>;
}
export {};
