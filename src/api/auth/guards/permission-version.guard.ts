import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionVersionService } from '../../rbac/services/permission-version.service';

/**
 * Guard that validates JWT permissions_version against database version
 * 
 * When a user's permissions change (role assignment/removal, role permission changes),
 * their permissions_version in the database is incremented. This guard compares the
 * version in the JWT with the current database version. If they don't match, the user
 * must refresh their token to get updated permissions.
 * 
 * This guard should be applied globally but excluded from the /auth/refresh endpoint
 * to avoid infinite loops.
 */
@Injectable()
export class PermissionVersionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionVersionGuard.name);

  constructor(
    private readonly permissionVersionService: PermissionVersionService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      // Skip validation if no user (will be caught by JwtAuthGuard)
      if (!user || !user.id) {
        this.logger.debug('No user in request, skipping permission version check');
        return true;
      }

      // Skip validation for /auth/refresh endpoint to avoid infinite loops
      const url = request.url;
      if (url.includes('/auth/refresh')) {
        this.logger.debug('Skipping permission version check for /auth/refresh endpoint');
        return true;
      }

      // Extract permissions_version from JWT payload
      const jwtVersion = user.permissions_version;
      
      // If JWT doesn't have permissions_version, allow request (backward compatibility)
      if (jwtVersion === undefined || jwtVersion === null) {
        this.logger.warn(`JWT for user ${user.id} does not contain permissions_version`);
        return true;
      }

      // Get current version from database
      const dbVersion = await this.permissionVersionService.getUserVersion(user.id);

      this.logger.debug(
        `Permission version check for user ${user.id}: JWT=${jwtVersion}, DB=${dbVersion}`,
      );

      // Compare versions
      if (jwtVersion < dbVersion) {
        this.logger.warn(
          `Permission version mismatch for user ${user.id}: JWT version ${jwtVersion} < DB version ${dbVersion}`,
        );
        
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Your permissions have been updated. Please refresh your session.',
          error: 'PERMISSIONS_CHANGED',
        });
      }

      this.logger.debug(
        `Permission version check passed for user ${user.id}: version ${jwtVersion}`,
      );

      return true;
    } catch (error) {
      // If it's our UnauthorizedException, re-throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // For any other error, log and allow request (graceful degradation)
      this.logger.error('Error in PermissionVersionGuard:', error);
      return true;
    }
  }
}
