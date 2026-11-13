import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../../entities/employees/employee.entity';
import { EmployeeLeaveRequest } from '../../entities/employees/employee-leave-request.entity';
import { EmployeeLeaveDocument } from '../../entities/employees/employee-leave-document.entity';
import { EmployeeOvertimePolicy } from '../../entities/employees/employee-overtime-policy.entity';
import { EmployeeOvertimeRequest } from '../../entities/employees/employee-overtime-request.entity';
import { User } from '../../entities/users/user.entity';
import { RBACModule } from '../rbac/rbac.module';
import { S3Service } from '../../common/services/s3.service';
import { EmployeesService } from './employees.service';
import { EmployeeLeaveService } from './employee-leave.service';
import { EmployeeOvertimeService } from './employee-overtime.service';
import { EmployeesController } from './employees.controller';
import { EmployeeOvertimeController } from './employee-overtime.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      EmployeeLeaveRequest,
      EmployeeLeaveDocument,
      EmployeeOvertimeRequest,
      EmployeeOvertimePolicy,
      User,
    ]),
    RBACModule,
  ],
  controllers: [EmployeesController, EmployeeOvertimeController],
  providers: [EmployeesService, EmployeeLeaveService, EmployeeOvertimeService, S3Service],
  exports: [EmployeesService, EmployeeLeaveService, EmployeeOvertimeService],
})
export class EmployeesModule {}
