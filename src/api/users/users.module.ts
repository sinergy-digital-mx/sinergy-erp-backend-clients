// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RBACTenant } from 'src/entities/rbac/tenant.entity';
import { UserStatus } from 'src/entities/users/user-status.entity';
import { User } from 'src/entities/users/user.entity';
import { RBACModule } from '../rbac/rbac.module';
import { UsersRolesController } from '../rbac/controllers/users-roles.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, RBACTenant, UserStatus]),
        RBACModule,
    ],
    controllers: [UsersController, UsersRolesController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
