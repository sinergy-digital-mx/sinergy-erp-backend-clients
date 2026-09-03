import { Injectable, ExecutionContext, Optional, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionVersionService } from '../rbac/services/permission-version.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    @Optional() private readonly permissionVersionService?: PermissionVersionService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, run the standard JWT authentication
    const isAuthenticated = await super.canActivate(context);
    
    if (!isAuthenticated) {
      return false;
    }

    // Now check permission version
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip version check for /auth/refresh endpoint
    const url = request.url;
    if (url.includes('/auth/refresh')) {
      this.logger.debug('Skipping permission version check for /auth/refresh endpoint');
      return true;
    }

    // If user doesn't have permissions_version in JWT, allow (backward compatibility)
    if (!user || user.permissions_version === undefined || user.permissions_version === null) {
      return true;
    }

    if (!this.permissionVersionService) {
      return true;
    }

    try {
      const dbVersion = await this.permissionVersionService.getUserVersion(user.id);

      this.logger.debug(
        `Permission version check for user ${user.id}: JWT=${user.permissions_version}, DB=${dbVersion}`,
      );

      // Compare versions
      if (user.permissions_version < dbVersion) {
        this.logger.warn(
          `Permission version mismatch for user ${user.id}: JWT version ${user.permissions_version} < DB version ${dbVersion}`,
        );
        
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Your permissions have been updated. Please refresh your session.',
          error: 'PERMISSIONS_CHANGED',
        });
      }

      return true;
    } catch (error) {
      // If it's our UnauthorizedException, re-throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // For any other error, log and allow request (graceful degradation)
      this.logger.error('Error checking permission version:', error);
      return true;
    }
  }
}