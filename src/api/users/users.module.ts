// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { UserStatus } from '../../entities/users/user-status.entity';
import { User } from '../../entities/users/user.entity';
import { UserBillingBranch } from '../../entities/users/user-billing-branch.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { PosDailyShift } from '../../entities/pos/pos-daily-shift.entity';
import { UserManagerReport } from '../../entities/users/user-manager-report.entity';
import { UserWarehouseAssignment } from '../../entities/control-desk/user-warehouse-assignment.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { RBACModule } from '../rbac/rbac.module';
import { UsersRolesController } from '../rbac/controllers/users-roles.controller';
import { EmployeesModule } from '../employees/employees.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            UserBillingBranch,
            RBACTenant,
            UserStatus,
            BillingBranch,
            PosDailyShift,
            UserManagerReport,
            UserWarehouseAssignment,
            Warehouse,
        ]),
        RBACModule,
        EmployeesModule,
    ],
    controllers: [UsersController, UsersRolesController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
