import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/users/user.entity';
import { Employee } from '../../entities/employees/employee.entity';
import { EmployeesService } from '../employees/employees.service';
import { EmployeeLeaveService } from '../employees/employee-leave.service';
import { CreateLeaveRequestDto } from '../employees/dto/create-leave-request.dto';
import { QueryLeaveRequestDto } from '../employees/dto/query-leave-request.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

@Injectable()
export class EmployeePortalService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly employeesService: EmployeesService,
    private readonly leaveService: EmployeeLeaveService,
  ) {}

  // Resuelve el empleado del usuario autenticado o niega el acceso al portal.
  private async resolveEmployee(tenantId: string, userId: string): Promise<Employee> {
    const employee = await this.employeesService.findEntityByUser(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException(
        'Tu cuenta no está registrada como empleado. Contacta a Recursos Humanos.',
      );
    }
    return employee;
  }

  async getMyProfile(tenantId: string, userId: string) {
    const employee = await this.resolveEmployee(tenantId, userId);
    return this.employeesService.findOne(tenantId, employee.id);
  }

  async updateMyProfile(
    tenantId: string,
    userId: string,
    dto: UpdateMyProfileDto,
  ) {
    const employee = await this.resolveEmployee(tenantId, userId);

    const user = await this.userRepo.findOne({
      where: { id: userId, tenant_id: tenantId },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.first_name !== undefined) user.first_name = dto.first_name;
    if (dto.last_name !== undefined) user.last_name = dto.last_name;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    await this.userRepo.save(user);
    return this.employeesService.findOne(tenantId, employee.id);
  }

  async uploadMyPhoto(tenantId: string, userId: string, file: any) {
    const employee = await this.resolveEmployee(tenantId, userId);
    return this.employeesService.uploadPhoto(tenantId, employee.id, file);
  }

  async getMyLeaveRequests(
    tenantId: string,
    userId: string,
    query?: QueryLeaveRequestDto,
  ) {
    const employee = await this.resolveEmployee(tenantId, userId);
    return this.leaveService.findAllByEmployee(tenantId, employee.id, query);
  }

  async createMyLeaveRequest(
    tenantId: string,
    userId: string,
    dto: CreateLeaveRequestDto,
  ) {
    const employee = await this.resolveEmployee(tenantId, userId);
    return this.leaveService.create(tenantId, employee.id, dto, userId);
  }

  async cancelMyLeaveRequest(tenantId: string, userId: string, requestId: string) {
    const employee = await this.resolveEmployee(tenantId, userId);
    return this.leaveService.cancel(tenantId, requestId, employee.id);
  }
}
