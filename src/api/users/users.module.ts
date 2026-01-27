// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Tenant } from 'src/entities/tenant/tenant.entity';
import { UserStatus } from 'src/entities/users/user-status.entity';
import { User } from 'src/entities/users/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Tenant, UserStatus])],
    controllers: [UsersController],
    providers: [UsersService],
})
export class UsersModule { }
