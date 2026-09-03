// src/api/auth/auth.module.ts
import { Global, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from '../../entities/users/user.entity';
import { UserBillingBranch } from '../../entities/users/user-billing-branch.entity';
import { UserWarehouseAssignment } from '../../entities/control-desk/user-warehouse-assignment.entity';
import { RBACModule } from '../rbac/rbac.module';
import { PermissionVersionGuard } from './guards/permission-version.guard';

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserBillingBranch, UserWarehouseAssignment]),
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '30d' },
        }),
        forwardRef(() => RBACModule),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, JwtAuthGuard, PermissionVersionGuard],
    exports: [AuthService, JwtStrategy, JwtModule, JwtAuthGuard, PermissionVersionGuard],
})
export class AuthModule { }
