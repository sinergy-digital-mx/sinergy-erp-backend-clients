import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../../entities/employees/employee.entity';
import { EmployeeLeaveRequest } from '../../entities/employees/employee-leave-request.entity';
import { User } from '../../entities/users/user.entity';
import { RBACModule } from '../rbac/rbac.module';
import { S3Service } from '../../common/services/s3.service';
import { EmployeesService } from './employees.service';
import { EmployeeLeaveService } from './employee-leave.service';
import { EmployeesController } from './employees.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, EmployeeLeaveRequest, User]),
    RBACModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeeLeaveService, S3Service],
  exports: [EmployeesService, EmployeeLeaveService],
})
export class EmployeesModule {}
