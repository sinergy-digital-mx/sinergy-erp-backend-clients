import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../../../entities/users/user.entity';
import { UserRole } from '../../../entities/rbac/user-role.entity';

/**
 * Service for managing permission version tracking
 * 
 * This service handles incrementing the permissions_version field on users
 * when their roles or permissions change. The version is used to detect
 * stale JWT tokens and force token refresh when permissions change.
 */
@Injectable()
export class PermissionVersionService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  /**
   * Increment the permissions_version for a single user
   * 
   * @param userId - The ID of the user whose version should be incremented
   * @returns Promise that resolves when the version is incremented
   */
  async incrementUserVersion(userId: string): Promise<void> {
    await this.userRepository.increment(
      { id: userId },
      'permissions_version',
      1,
    );
  }

  /**
   * Increment permissions_version for all users with a specific role
   * 
   * This is used when a role's permissions are modified, requiring all
   * users with that role to refresh their tokens.
   * 
   * @param roleId - The ID of the role whose users should have versions incremented
   * @param tenantId - The tenant ID to scope the operation
   * @returns Promise that resolves when all versions are incremented
   */
  async incrementVersionForUsersInTenant(tenantId: string): Promise<void> {
    await this.userRepository.increment(
      { tenant_id: tenantId },
      'permissions_version',
      1,
    );
  }

  async incrementVersionForUsersWithRole(
    roleId: string,
    tenantId: string,
  ): Promise<void> {
    // Find all users with this role in the tenant
    const userRoles = await this.userRoleRepository.find({
      where: {
        role_id: roleId,
        tenant_id: tenantId,
      },
      select: ['user_id'],
    });

    // Extract unique user IDs
    const userIds = [...new Set(userRoles.map((ur) => ur.user_id))];

    // Increment version for each user
    if (userIds.length > 0) {
      await this.userRepository.increment(
        { id: In(userIds) },
        'permissions_version',
        1,
      );
    }
  }

  /**
   * Get the current permissions_version for a user
   * 
   * @param userId - The ID of the user
   * @returns Promise that resolves to the current version number
   */
  async getUserVersion(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['permissions_version'],
    });

    return user?.permissions_version ?? 1;
  }
}
