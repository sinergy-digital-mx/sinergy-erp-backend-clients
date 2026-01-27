// src/api/auth/jwt.strategy.ts
import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET as string,
        });
    }

    async validate(payload: any) {
        const user = {
            id: payload.sub,
            user_id: payload.sub, // For backward compatibility
            tenantId: payload.tenant_id,
            tenant_id: payload.tenant_id, // For backward compatibility
            email: payload.email,
            status: payload.status,
            roles: payload.roles || [],
            permissions: payload.permissions || [],
            hasAdminRole: payload.hasAdminRole || false,
            permissionCount: payload.permissionCount || 0,
        };

        this.logger.debug(`JWT validation successful for user ${payload.sub} in tenant ${payload.tenant_id} with ${payload.permissions?.length || 0} permissions`);

        return user;
    }
}
