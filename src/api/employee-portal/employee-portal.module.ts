import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/users/user.entity';
import { RBACModule } from '../rbac/rbac.module';
import { EmployeesModule } from '../employees/employees.module';
import { EmployeePortalService } from './employee-portal.service';
import { EmployeePortalController } from './employee-portal.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    RBACModule,
    EmployeesModule,
  ],
  controllers: [EmployeePortalController],
  providers: [EmployeePortalService],
})
export class EmployeePortalModule {}
