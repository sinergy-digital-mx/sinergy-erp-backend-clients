import { Repository } from 'typeorm';
import { User } from '../../../entities/users/user.entity';
import { UserRole } from '../../../entities/rbac/user-role.entity';
export declare class PermissionVersionService {
    private readonly userRepository;
    private readonly userRoleRepository;
    constructor(userRepository: Repository<User>, userRoleRepository: Repository<UserRole>);
    incrementUserVersion(userId: string): Promise<void>;
    incrementVersionForUsersInTenant(tenantId: string): Promise<void>;
    incrementVersionForUsersWithRole(roleId: string, tenantId: string): Promise<void>;
    getUserVersion(userId: string): Promise<number>;
}
