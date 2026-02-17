// src/customers/customers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomerGroupsController } from './customer-groups.controller';
import { CustomerGroupsService } from './customer-groups.service';
import { CustomerActivitiesController } from './customer-activities.controller';
import { CustomerActivitiesService } from './customer-activities.service';
import { CustomerStatus } from 'src/entities/customers/customer-status.entity';
import { Customer } from 'src/entities/customers/customer.entity';
import { CustomerGroup } from 'src/entities/customers/customer-group.entity';
import { CustomerActivity } from 'src/entities/customers/customer-activity.entity';
import { RBACModule } from '../rbac/rbac.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Customer, CustomerStatus, CustomerGroup, CustomerActivity]),
        RBACModule,
    ],
    providers: [
        CustomersService,
        CustomerGroupsService,
        CustomerActivitiesService,
    ],
    controllers: [CustomersController, CustomerGroupsController, CustomerActivitiesController],
})
export class CustomersModule { }
