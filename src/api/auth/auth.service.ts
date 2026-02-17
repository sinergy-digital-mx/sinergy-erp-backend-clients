// src/api/auth/auth.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/users/user.entity';
import { PermissionService } from '../rbac/services/permission.service';
import { RoleService } from '../rbac/services/role.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        private jwtService: JwtService,
        private permissionService: PermissionService,
        private roleService: RoleService,
    ) { }

    async login(email: string, password: string) {
        const user = await this.userRepo.findOne({
            where: { email },
            relations: ['tenant', 'status'],
        });

        if (!user) {
            this.logger.warn(`Login attempt with non-existent email: ${email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            this.logger.warn(`Invalid password for user: ${email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login timestamp
        user.last_login_at = new Date();
        await this.userRepo.save(user);

        // Load user roles and permissions for the tenant
        let userRoles: any[] = [];
        let userPermissions: any[] = [];
        let permissionsByModule: any = {};
        
        try {
            userRoles = await this.roleService.getUserRoles(user.id, user.tenant.id.toString());
            userPermissions = await this.permissionService.getUserPermissions(user.id, user.tenant.id.toString());
            
            // Group permissions by module
            permissionsByModule = userPermissions.reduce((acc: any, perm: any) => {
                const moduleName = perm.module?.name || 'System';
                if (!acc[moduleName]) {
                    acc[moduleName] = [];
                }
                acc[moduleName].push({
                    id: perm.id,
                    action: perm.action,
                    description: perm.description,
                });
                return acc;
            }, {});
            
            this.logger.debug(`User ${user.id} has ${userRoles.length} roles and ${userPermissions.length} permissions in tenant ${user.tenant.id}`);
        } catch (error) {
            this.logger.error(`Failed to load RBAC data for user ${user.id}: ${error.message}`);
            // Continue with login even if RBAC data fails to load
        }

        // Create JWT payload with RBAC context
        // Format permissions as entity:Action (e.g., "customers:Create")
        const permissionsForJwt = userPermissions.map(permission => 
            `${permission.entity_type.toLowerCase()}:${permission.action}`
        );

        const payload = {
            sub: user.id,
            email: user.email,
            tenant_id: user.tenant.id,
            status: user.status.code,
            roles: userRoles.map(role => ({
                id: role.id,
                name: role.name,
                isSystemRole: role.is_system_role,
            })),
            // Include permissions in JWT for client-side checks
            permissions: permissionsForJwt,
            hasAdminRole: userRoles.some(role => role.name === 'Admin'),
            permissionCount: userPermissions.length,
            iat: Math.floor(Date.now() / 1000),
        };

        const accessToken = this.jwtService.sign(payload);

        this.logger.log(`Successful login for user ${email} in tenant ${user.tenant.id}`);

        return {
            access_token: accessToken,
            user: {
                id: user.id,
                email: user.email,
                tenant_id: user.tenant.id,
                status: user.status.code,
                roles: userRoles.map(role => role.name),
                permissions: permissionsByModule,
                // Also include flat permissions array for UI convenience
                permissions_flat: permissionsForJwt,
                last_login_at: user.last_login_at,
            },
        };
    }

    /**
     * Refresh user permissions and generate new token
     * Useful when user roles/permissions change during their session
     */
    async refreshToken(userId: string, tenantId: string) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['tenant', 'status'],
        });

        if (!user || user.tenant.id.toString() !== tenantId) {
            throw new UnauthorizedException('Invalid user or tenant');
        }

        // Load fresh RBAC data
        const userRoles = await this.roleService.getUserRoles(userId, tenantId);
        const userPermissions = await this.permissionService.getUserPermissions(userId, tenantId);

        // Format permissions as entity:Action for JWT
        const permissionsForJwt = userPermissions.map(permission => 
            `${permission.entity_type.toLowerCase()}:${permission.action}`
        );

        const payload = {
            sub: user.id,
            email: user.email,
            tenant_id: user.tenant.id,
            status: user.status.code,
            roles: userRoles.map(role => ({
                id: role.id,
                name: role.name,
                isSystemRole: role.is_system_role,
            })),
            permissions: permissionsForJwt,
            hasAdminRole: userRoles.some(role => role.name === 'Admin'),
            permissionCount: userPermissions.length,
            iat: Math.floor(Date.now() / 1000),
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                tenant_id: user.tenant.id,
                status: user.status.code,
                roles: userRoles.map(role => role.name),
                permissions_flat: permissionsForJwt,
            },
        };
    }

    /**
     * Validate user and load their RBAC context
     * Used by guards and middleware
     */
    async validateUserWithRBAC(userId: string, tenantId: string) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['tenant', 'status'],
        });

        if (!user) {
            return null;
        }

        // Validate tenant access
        if (user.tenant.id.toString() !== tenantId) {
            const hasAccess = await this.permissionService.validateUserTenantAccess(userId, tenantId);
            if (!hasAccess) {
                return null;
            }
        }

        const userRoles = await this.roleService.getUserRoles(userId, tenantId);
        const userPermissions = await this.permissionService.getUserPermissions(userId, tenantId);

        return {
            id: user.id,
            email: user.email,
            tenant_id: tenantId,
            status: user.status.code,
            roles: userRoles,
            permissions: userPermissions,
        };
    }
}
