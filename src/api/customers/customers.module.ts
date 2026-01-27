// src/customers/customers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomerStatus } from 'src/entities/customers/customer-status.entity';
import { Customer } from 'src/entities/customers/customer.entity';
import { Tenant } from 'src/entities/tenant/tenant.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Customer, CustomerStatus, Tenant])],
    controllers: [CustomersController],
    providers: [CustomersService],
})
export class CustomersModule { }
