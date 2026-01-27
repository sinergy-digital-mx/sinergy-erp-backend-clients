// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatus } from 'src/entities/users/user-status.entity';
import { Tenant } from 'src/entities/tenant/tenant.entity';
import { User } from 'src/entities/users/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        @InjectRepository(UserStatus) private statusRepo: Repository<UserStatus>,
    ) { }

    async create(dto: CreateUserDto) {
        const tenant = await this.tenantRepo.findOneByOrFail({ id: dto.tenant_id });
        const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });

        return this.userRepo.save({
            email: dto.email,
            password: dto.password,
            tenant,
            status,
        });
    }

    async update(id: number, dto: UpdateUserDto) {
        await this.userRepo.update(id, dto);
        return this.userRepo.findOneBy({ id });
    }

    findAll() {
        return this.userRepo.find({ relations: ['tenant', 'status'] });
    }
}
