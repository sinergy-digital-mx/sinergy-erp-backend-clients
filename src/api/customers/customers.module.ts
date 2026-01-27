// src/customers/customers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomerStatus } from 'src/entities/customers/customer-status.entity';
import { Customer } from 'src/entities/customers/customer.entity';
import { RBACTenant } from 'src/entities/rbac/tenant.entity';
import { RBACModule } from '../rbac/rbac.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Customer, CustomerStatus, RBACTenant]),
        RBACModule,
    ],
    controllers: [CustomersController],
    providers: [CustomersService],
})
export class CustomersModule { }
