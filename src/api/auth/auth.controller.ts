// src/api/auth/auth.controller.ts
import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiBody, ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { PermissionService } from '../rbac/services/permission.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly tenantContextService: TenantContextService,
        private readonly permissionService: PermissionService,
    ) { }

    @Post('login')
    @ApiBody({ type: LoginDto })
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({
        status: 200,
        description: 'Login successful with permissions',
        schema: {
            example: {
                access_token: 'eyJhbGc...',
                user: {
                    id: 'uuid',
                    email: 'user@example.com',
                    tenant_id: 'uuid',
                    status: 'Active',
                    roles: ['Sales Rep'],
                    permissions: {
                        'Lead Management': [
                            { id: 1, action: 'Read', description: 'View leads' },
                            { id: 2, action: 'Create', description: 'Create leads' }
                        ]
                    }
                }
            }
        }
    })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto.email, dto.password);
    }

    @Get('me/permissions')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user permissions' })
    @ApiResponse({
        status: 200,
        description: 'User permissions grouped by module',
        schema: {
            example: {
                user_id: 'uuid',
                tenant_id: 'uuid',
                permissions: ['Customer:Read', 'Customer:Create', 'Lead:Read'],
                permissions_by_module: {
                    'Customer Management': [
                        { id: 1, action: 'Read', description: 'View customers' },
                        { id: 2, action: 'Create', description: 'Create customers' }
                    ],
                    'Lead Management': [
                        { id: 3, action: 'Read', description: 'View leads' }
                    ]
                }
            }
        }
    })
    async getCurrentUserPermissions() {
        const userId = this.tenantContextService.getCurrentUserId();
        const tenantId = this.tenantContextService.getCurrentTenantId();

        if (!userId || !tenantId) {
            throw new Error('User context is required');
        }

        const permissions = await this.permissionService.getUserPermissions(userId, tenantId);

        // Group permissions by module
        const permissionsByModule = permissions.reduce((acc: any, perm: any) => {
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

        return {
            user_id: userId,
            tenant_id: tenantId,
            permissions: permissions.map(p => `${p.entity_type}:${p.action}`),
            permissions_by_module: permissionsByModule,
        };
    }
}
