// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatus } from '../../entities/users/user-status.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { User } from '../../entities/users/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(RBACTenant) private tenantRepo: Repository<RBACTenant>,
        @InjectRepository(UserStatus) private statusRepo: Repository<UserStatus>,
    ) { }

    async create(dto: CreateUserDto, tenantId: string) {
        const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        return this.userRepo.save({
            ...dto,
            password: hashedPassword,
            tenant: { id: tenantId },
            tenant_id: tenantId,
            status,
            permissions_version: 1,
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

        // Hash password if it's being updated
        if (dto.password) {
            dto.password = await bcrypt.hash(dto.password, 10);
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
