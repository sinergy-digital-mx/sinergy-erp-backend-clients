// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatus } from 'src/entities/users/user-status.entity';
import { RBACTenant } from 'src/entities/rbac/tenant.entity';
import { User } from 'src/entities/users/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(RBACTenant) private tenantRepo: Repository<RBACTenant>,
        @InjectRepository(UserStatus) private statusRepo: Repository<UserStatus>,
    ) { }

    async create(dto: CreateUserDto, tenantId: string) {
        const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });

        return this.userRepo.save({
            ...dto,
            tenant: { id: tenantId },
            tenant_id: tenantId,
            status,
        });
    }

    async update(id: string, dto: UpdateUserDto, tenantId: string) {
        const user = await this.userRepo.findOneByOrFail({
            id,
            tenant_id: tenantId,
        });

        if (dto.status_id) {
            const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });
            user.status = status;
        }

        Object.assign(user, dto);
        return this.userRepo.save(user);
    }

    findAll(tenantId: string) {
        return this.userRepo.find({
            where: { tenant_id: tenantId },
            relations: ['status', 'tenant'],
        });
    }

    findOne(id: string, tenantId: string) {
        return this.userRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['status', 'tenant'],
        });
    }
}
