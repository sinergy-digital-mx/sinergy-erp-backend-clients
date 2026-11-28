import { Repository } from 'typeorm';
import { User } from '../entities/users/user.entity';
export declare function callerBranchIds(userRepo: Repository<User>, tenantId: string, userId: string): Promise<string[] | null>;
export declare function narrowBranchIds(allowed: string[] | null, requested: string[]): string[] | null;
